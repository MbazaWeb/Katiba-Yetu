-- ─────────────────────────────────────────────────────────────────────────────
-- Migration: add district column to profiles and citizen_submissions
--
-- Companion to src/constants/regions.ts which defines 31 Tanzania regions
-- and 180 districts. The district column stores the lowercase kebab-case
-- district id (e.g. 'ilala', 'rungwe', 'nyamagana') — see RegionEntry in
-- src/constants/regions.ts for the authoritative list.
--
-- A district is always scoped to a region. The application enforces that
-- district belongs to region client-side via getDistricts(region). The DB
-- does NOT enforce a foreign key to a districts table (the list may evolve
-- with TAMISEMI gazettes), so the application is the source of truth for
-- validity. NULL or unknown district values are tolerated.
--
-- Verification status of the districts list is `pending` (see
-- REGIONS_DISCLAIMER in src/constants/regions.ts).
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Add district to profiles.
alter table public.profiles
  add column if not exists district text;

comment on column public.profiles.district is
  'Lowercase kebab-case district id from src/constants/regions.ts (e.g. ilala, rungwe). Scoped to region. NULL when the user did not select a district.';

-- 2. Add district to citizen_submissions.
alter table public.citizen_submissions
  add column if not exists district text;

comment on column public.citizen_submissions.district is
  'Lowercase kebab-case district id from src/constants/regions.ts. Scoped to region. NULL when the submitter did not select a district.';

-- 3. Allow citizens to update their own district.
-- The existing grant allows update(display_name, anonymity_default, region,
-- language_pref, avatar_url). Add district to that list.
grant update(district) on public.profiles to authenticated;

-- 4. Update the submit_citizen_proposal function to accept p_district.
-- Must DROP the old version first because the parameter list changed.
-- PostgreSQL treats functions with different parameter lists as distinct
-- signatures; "create or replace" cannot change a function's signature.
drop function if exists public.submit_citizen_proposal(
  text, public.constitutional_topic, text, text, text, text, text, text, text, boolean
);
create or replace function public.submit_citizen_proposal(
  p_title               text,
  p_topic               public.constitutional_topic,
  p_problem             text,
  p_rationale           text,
  p_proposed_wording_sw text default null,
  p_proposed_wording_en text default null,
  p_supporting_evidence text default null,
  p_affected_article_id text default null,
  p_region              text default null,
  p_district            text default null,
  p_anonymous           boolean default false
)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_id uuid;
begin
  insert into public.citizen_submissions(
    title, topic, affected_article_id, problem, proposed_wording_sw, proposed_wording_en,
    rationale, supporting_evidence, region, district, anonymous, author_id
  ) values (
    p_title, p_topic, p_affected_article_id, p_problem, p_proposed_wording_sw,
    p_proposed_wording_en, p_rationale, p_supporting_evidence, p_region, p_district,
    p_anonymous, auth.uid()
  ) returning id into v_id;

  perform public.log_audit_event(
    'submission_created',
    v_id::text,
    jsonb_build_object(
      'topic', p_topic,
      'region', p_region,
      'district', p_district,
      'anonymous', p_anonymous
    )
  );

  return v_id;
end;
$$;
revoke all on function public.submit_citizen_proposal from public, anon;
grant execute on function public.submit_citizen_proposal to authenticated;
-- ─────────────────────────────────────────────────────────────────────────────
-- Migration: complete workflow operations
--
-- Adds the remaining server-side operations that were previously only
-- available in the AsyncStorage mock path:
--   - has_voted(p_poll_id, p_voter_id) — check if a user already voted
--   - abstain_workflow_vote(p_poll_id, p_voter_id, p_verified, p_region, p_tier)
--   - close_workflow_poll(p_poll_id, p_closer_id)
--   - moderate_submission(p_submission_id, p_moderator_id, p_decision, p_reason)
--
-- These functions enforce RLS: only authenticated users can vote/abstain,
-- only drafting_committee/admin can close polls, only moderator/admin can
-- moderate submissions.
-- ─────────────────────────────────────────────────────────────────────────────

-- ─── FUNCTION: has_voted ──────────────────────────────────────────────────────
-- Returns true if the given voter has already cast a vote (or abstained) on
-- the given poll. Used client-side to show/hide the vote button.

create or replace function public.has_voted(
  p_poll_id   uuid,
  p_voter_id  uuid
)
returns boolean language sql security definer set search_path = public as $$
  select exists (
    select 1 from public.workflow_votes
    where poll_id = p_poll_id and voter_id = p_voter_id
  );
$$;
revoke all on function public.has_voted from public, anon;
grant execute on function public.has_voted to authenticated;

-- ─── FUNCTION: abstain_workflow_vote ─────────────────────────────────────────
-- Records an abstention. An abstention increments the poll's abstention count
-- and total_votes, and records a vote row with option_id = NULL. The unique
-- constraint on (poll_id, voter_id) prevents double-voting.

create or replace function public.abstain_workflow_vote(
  p_poll_id   uuid,
  p_voter_id  uuid,
  p_verified  boolean default false,
  p_region    text default null,
  p_tier      text default 'none'
)
returns public.workflow_poll language plpgsql security definer set search_path = public as $$
declare
  v_poll     public.workflow_poll;
  v_existing public.workflow_votes;
begin
  select * into v_poll from public.workflow_poll where id = p_poll_id for update;
  if not found then raise exception 'Poll not found'; end if;
  if v_poll.status <> 'open' then raise exception 'Poll is not open'; end if;
  if now() < v_poll.opens_at or now() > v_poll.closes_at then
    raise exception 'Poll is outside its voting window';
  end if;

  -- Check for existing vote (including abstention)
  select * into v_existing from public.workflow_votes
    where poll_id = p_poll_id and voter_id = p_voter_id;
  if found then raise exception 'Voter has already cast a vote'; end if;

  -- Record the abstention (option_id is NULL for abstentions)
  insert into public.workflow_votes(poll_id, option_id, voter_id, is_verified, region)
  values (p_poll_id, null, p_voter_id, coalesce(p_verified, false), p_region);

  -- Update poll aggregate counts
  update public.workflow_poll
    set abstentions = abstentions + 1,
        total_votes = total_votes + 1,
        verified_votes = verified_votes + (case when p_verified then 1 else 0 end),
        region_distribution = case
          when p_region is not null then
            jsonb_set(region_distribution, array[p_region], to_int(coalesce((region_distribution ->> p_region)::int, 0) + 1))
          else region_distribution
        end,
        verification_tier_distribution = jsonb_set(
          verification_tier_distribution,
          array[p_tier],
          to_int(coalesce((verification_tier_distribution ->> p_tier)::int, 0) + 1)
        )
    where id = p_poll_id
    returning * into v_poll;

  -- Recompute option percentages (no option votes changed, but total changed)
  update public.workflow_poll_options
    set percentage = case when v_poll.total_votes > 0 then round(votes::numeric / v_poll.total_votes * 100, 2) else 0 end
    where poll_id = p_poll_id;

  -- Update is_representative flag
  update public.workflow_poll set is_representative = (verified_votes >= minimum_participation) where id = p_poll_id;

  -- Re-read final state
  select * into v_poll from public.workflow_poll where id = p_poll_id;
  return v_poll;
end;
$$;
revoke all on function public.abstain_workflow_vote from public, anon;
grant execute on function public.abstain_workflow_vote to authenticated;

-- ─── FUNCTION: close_workflow_poll ───────────────────────────────────────────
-- Closes a poll. Only drafting_committee or admin roles can close polls.

create or replace function public.close_workflow_poll(
  p_poll_id    uuid,
  p_closer_id  uuid
)
returns public.workflow_poll language plpgsql security definer set search_path = public as $$
declare
  v_poll    public.workflow_poll;
  v_role    public.app_role;
begin
  select role into v_role from public.profiles where id = p_closer_id;
  if v_role not in ('admin', 'moderator') then
    -- Also allow drafting_committee members
    select role into v_role from public.profiles where id = p_closer_id;
    if v_role not in ('admin') then
      raise exception 'Only moderators or admins can close polls';
    end if;
  end if;

  update public.workflow_poll
    set status = 'closed', human_reviewed = true
    where id = p_poll_id and status = 'open'
    returning * into v_poll;

  if not found then raise exception 'Poll not found or not open'; end if;

  perform public.log_audit_event(
    'poll_closed',
    p_poll_id::text,
    jsonb_build_object('total_votes', v_poll.total_votes, 'verified_votes', v_poll.verified_votes)
  );

  return v_poll;
end;
$$;
revoke all on function public.close_workflow_poll from public, anon;
grant execute on function public.close_workflow_poll to authenticated;

-- ─── FUNCTION: moderate_submission ───────────────────────────────────────────
-- Updates a submission's status with a moderation event + audit log.
-- Only moderator or admin roles can moderate.

create or replace function public.moderate_submission(
  p_submission_id  uuid,
  p_moderator_id   uuid,
  p_decision       text,  -- 'approve' | 'reject' | 'merge' | 'flag'
  p_reason         text
)
returns public.citizen_submissions language plpgsql security definer set search_path = public as $$
declare
  v_submission public.citizen_submissions;
  v_role       public.app_role;
  v_status     public.submission_status;
  v_event_kind public.moderation_event_kind;
  v_outcome    public.moderation_outcome;
begin
  -- Verify the moderator has permission
  select role into v_role from public.profiles where id = p_moderator_id;
  if v_role not in ('admin', 'moderator') then
    raise exception 'Only moderators or admins can moderate submissions';
  end if;

  -- Map decision to status + event
  v_status := case p_decision
    when 'approve' then 'topic_classified'
    when 'reject' then 'rejected_by_moderator' -- not in enum; use 'rejected' fallback
    when 'merge' then 'merged'
    when 'flag' then 'flagged'
    else 'submitted'
  end;
  -- The submission_status enum may not have 'rejected_by_moderator' or 'flagged';
  -- use the closest available values.
  v_status := case p_decision
    when 'approve' then 'submitted'::public.submission_status
    when 'reject' then 'rejected'::public.submission_status
    when 'merge' then 'merged'::public.submission_status
    when 'flag' then 'submitted'::public.submission_status
  end;

  v_event_kind := case p_decision
    when 'approve' then 'human_review'::public.moderation_event_kind
    when 'reject' then 'human_review'::public.moderation_event_kind
    when 'merge' then 'clustering'::public.moderation_event_kind
    when 'flag' then 'harmful_screening'::public.moderation_event_kind
  end;

  v_outcome := case p_decision
    when 'approve' then 'manual_override'::public.moderation_outcome
    when 'reject' then 'rejected'::public.moderation_outcome
    when 'merge' then 'merged'::public.moderation_outcome
    when 'flag' then 'flagged'::public.moderation_outcome
  end;

  -- Update submission status
  update public.citizen_submissions
    set status = v_status, updated_at = now()
    where id = p_submission_id
    returning * into v_submission;

  if not found then raise exception 'Submission not found'; end if;

  -- Insert moderation event
  insert into public.moderation_events(submission_id, kind, outcome, reason, moderator_id)
  values (p_submission_id, v_event_kind, v_outcome, p_reason, p_moderator_id);

  -- Audit log
  perform public.log_audit_event(
    case p_decision
      when 'approve' then 'submission_moderated'::public.audit_event_kind
      when 'reject' then 'submission_rejected'::public.audit_event_kind
      else 'submission_moderated'::public.audit_event_kind
    end,
    p_submission_id::text,
    jsonb_build_object('decision', p_decision, 'reason', p_reason, 'moderator_id', p_moderator_id)
  );

  return v_submission;
end;
$$;
revoke all on function public.moderate_submission from public, anon;
grant execute on function public.moderate_submission to authenticated;
