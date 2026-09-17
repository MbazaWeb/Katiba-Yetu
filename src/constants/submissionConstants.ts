/**
 * Constants for the citizen submission pipeline.
 */

export const SUBMISSION_DISCLAIMER =
  'Mapendekezo ya wananchi hayawakilishi maandishi rasmi ya Katiba. Yamepitia udhibiti wa awali tu. ' +
  'Citizen proposals do not represent official constitutional text. They have only passed initial screening.';

export const POLL_STAGE_LABELS_SHORT = {
  problem_confirmation:  { sw: 'Tatizo',     en: 'Problem' },
  policy_direction:      { sw: 'Sera',       en: 'Policy' },
  article_wording:       { sw: 'Ibara',       en: 'Wording' },
  approval_for_draft:    { sw: 'Idhini',     en: 'Approval' },
} as const;
