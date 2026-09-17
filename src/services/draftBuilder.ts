/**
 * Draft builder service — Phase 2.
 *
 * Authorized drafting committee workspace. Allows authorized reviewers to:
 *   - create a draft version
 *   - select approved proposed articles
 *   - assign chapter and article numbers
 *   - reorder chapters
 *   - edit proposed wording (creates an audit entry)
 *   - attach reviewer notes
 *   - send an article back for discussion
 *   - request another poll
 *   - mark an article as legally reviewed
 *   - publish a public draft version
 *
 * Drafts are immutable after publication. Every edit creates an audit-history
 * entry. Restoring an earlier version creates a new version rather than
 * overwriting history.
 *
 * Governance rule: all content actions are auditable.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import type {
  DraftVersion, DraftChange, DraftBuilderAction, DraftBuilderActionKind, DraftBuilderRole,
  ProposedArticle, ProposedChapter, ApprovalWorkflowState, ApprovalRules, ApprovalStage,
} from '../types';
import { DEFAULT_APPROVAL_RULES, canPerform } from '../types';
import { mockVersions } from './proposedConstitution';
import { logAuditEvent } from './submissionWorkflow';

const DRAFTS_KEY = '@katibayetu/draft_versions';
const ACTIONS_KEY = '@katibayetu/draft_actions';
const WORKFLOW_KEY = '@katibayetu/approval_workflows';

function makeId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// ─── Permission enforcement ──────────────────────────────────────────────────

export class AuthorizationError extends Error {
  constructor(role: DraftBuilderRole, action: DraftBuilderActionKind) {
    super(`Role "${role}" is not authorised to perform action "${action}".`);
    this.name = 'AuthorizationError';
  }
}

function requirePermission(role: DraftBuilderRole, permission: Parameters<typeof canPerform>[1]) {
  if (!canPerform(role, permission)) throw new AuthorizationError(role, permission as DraftBuilderActionKind);
}

// ─── Draft version lifecycle ─────────────────────────────────────────────────

export async function loadDraftVersions(): Promise<DraftVersion[]> {
  try {
    const raw = await AsyncStorage.getItem(DRAFTS_KEY);
    if (!raw) return mockVersions;
    return JSON.parse(raw) as DraftVersion[];
  } catch { return mockVersions; }
}

export async function saveDraftVersions(list: DraftVersion[]): Promise<void> {
  try { await AsyncStorage.setItem(DRAFTS_KEY, JSON.stringify(list)); } catch (e) { console.warn('[draft] save failed', e); }
}

export async function createDraftVersion(input: { constitutionId: string; name: string; versionNumber: string; actor: { id: string; name: string; role: DraftBuilderRole } }): Promise<{ version: DraftVersion; action: DraftBuilderAction }> {
  requirePermission(input.actor.role, 'draft.create_version');
  const id = makeId('dv');
  const now = new Date().toISOString();
  const version: DraftVersion = {
    id, constitutionId: input.constitutionId, name: input.name, versionNumber: input.versionNumber,
    publishedAt: null, status: 'draft', totalChapters: 0, totalArticles: 0,
    awaitingLegalReview: 0, approved: 0, disputed: 0, participationCount: 0,
    regionalCoverage: 0, lastUpdate: now, changeLog: [], immutable: false,
  };
  const list = await loadDraftVersions();
  list.push(version);
  await saveDraftVersions(list);

  const action: DraftBuilderAction = {
    id: makeId('action'), versionId: id, actorId: input.actor.id, actorName: input.actor.name, actorRole: input.actor.role,
    kind: 'create_version', description: `Created draft version "${input.name}" (${input.versionNumber}).`,
    at: now,
  };
  await logDraftAction(action);
  await logAuditEvent({
    id: makeId('audit'), kind: 'draft_version_created', versionId: id,
    actorId: input.actor.id, actorName: input.actor.name, actorRole: input.actor.role,
    description: `Draft version "${input.name}" (${input.versionNumber}) created.`,
    publicMetadata: { versionNumber: input.versionNumber }, at: now,
  });
  return { version, action };
}

export async function publishDraftVersion(versionId: string, actor: { id: string; name: string; role: DraftBuilderRole }): Promise<DraftVersion> {
  requirePermission(actor.role, 'draft.publish_version');
  const list = await loadDraftVersions();
  const idx = list.findIndex(v => v.id === versionId);
  if (idx === -1) throw new Error('Draft version not found');
  const v = list[idx];
  if (v.immutable) throw new Error('Draft is already published and immutable.');
  const now = new Date().toISOString();
  const updated: DraftVersion = { ...v, status: 'published', publishedAt: now, immutable: true, lastUpdate: now };
  list[idx] = updated;
  await saveDraftVersions(list);

  const change: DraftChange = {
    id: makeId('dc'), versionId, kind: 'modified', articleId: '', description: 'Draft version published.',
    actorId: actor.id, actorName: actor.name, at: now,
  };
  const updatedWithChange: DraftVersion = { ...updated, changeLog: [...updated.changeLog, change] };
  list[idx] = updatedWithChange;
  await saveDraftVersions(list);

  await logDraftAction({
    id: makeId('action'), versionId, actorId: actor.id, actorName: actor.name, actorRole: actor.role,
    kind: 'publish_version', description: `Published draft version "${v.name}".`, at: now,
  });
  await logAuditEvent({
    id: makeId('audit'), kind: 'draft_version_published', versionId,
    actorId: actor.id, actorName: actor.name, actorRole: actor.role,
    description: `Draft version "${v.name}" published and is now immutable.`,
    publicMetadata: { versionNumber: v.versionNumber, articles: v.totalArticles }, at: now,
  });
  return updatedWithChange;
}

export async function archiveDraftVersion(versionId: string, actor: { id: string; name: string; role: DraftBuilderRole }): Promise<DraftVersion> {
  requirePermission(actor.role, 'draft.archive_version');
  const list = await loadDraftVersions();
  const idx = list.findIndex(v => v.id === versionId);
  if (idx === -1) throw new Error('Draft version not found');
  const v = list[idx];
  const now = new Date().toISOString();
  const updated: DraftVersion = { ...v, status: 'archived', lastUpdate: now };
  list[idx] = updated;
  await saveDraftVersions(list);
  await logDraftAction({
    id: makeId('action'), versionId, actorId: actor.id, actorName: actor.name, actorRole: actor.role,
    kind: 'archive_version', description: `Archived draft version "${v.name}".`, at: now,
  });
  return updated;
}

export async function restoreFromVersion(versionId: string, actor: { id: string; name: string; role: DraftBuilderRole }): Promise<DraftVersion> {
  requirePermission(actor.role, 'draft.restore_version');
  const list = await loadDraftVersions();
  const source = list.find(v => v.id === versionId);
  if (!source) throw new Error('Source draft version not found');
  // Restoration creates a new version rather than overwriting history.
  const now = new Date().toISOString();
  const newVersionNumber = `${source.versionNumber}-restored-${Date.now()}`;
  const newVersion: DraftVersion = {
    ...source,
    id: makeId('dv'), name: `${source.name} (restored)`, versionNumber: newVersionNumber,
    publishedAt: null, status: 'draft', immutable: false, lastUpdate: now,
    changeLog: [{
      id: makeId('dc'), versionId: '', kind: 'added', articleId: '', description: `Restored from version ${source.versionNumber}.`,
      actorId: actor.id, actorName: actor.name, at: now,
    }],
  };
  newVersion.changeLog[0].versionId = newVersion.id;
  list.push(newVersion);
  await saveDraftVersions(list);
  await logDraftAction({
    id: makeId('action'), versionId: newVersion.id, actorId: actor.id, actorName: actor.name, actorRole: actor.role,
    kind: 'restore_from_version', description: `Restored from version ${source.versionNumber} as new version ${newVersion.versionNumber}.`,
    at: now,
  });
  await logAuditEvent({
    id: makeId('audit'), kind: 'draft_version_restored', versionId: newVersion.id,
    actorId: actor.id, actorName: actor.name, actorRole: actor.role,
    description: `Restored draft from version ${source.versionNumber} into new version ${newVersion.versionNumber}.`,
    publicMetadata: { restoredFrom: source.versionNumber, newVersion: newVersion.versionNumber }, at: now,
  });
  return newVersion;
}

// ─── Article-level actions within a draft version ───────────────────────────

export interface ArticleEditInput {
  versionId: string;
  articleId: string;
  field: 'proposedTitle' | 'proposedText' | 'plainLanguageSummary' | 'rationale';
  language: 'sw' | 'en';
  before: string;
  after: string;
  actor: { id: string; name: string; role: DraftBuilderRole };
}

export async function editArticleWording(input: ArticleEditInput): Promise<{ action: DraftBuilderAction; change: DraftChange }> {
  requirePermission(input.actor.role, 'draft.edit_wording');
  if (!input.after.trim()) throw new Error('Edited wording cannot be empty.');
  const now = new Date().toISOString();
  const change: DraftChange = {
    id: makeId('dc'), versionId: input.versionId, kind: 'modified', articleId: input.articleId,
    description: `Edited ${input.field} (${input.language}).`,
    actorId: input.actor.id, actorName: input.actor.name, at: now,
  };
  await appendDraftChange(input.versionId, change);
  const action: DraftBuilderAction = {
    id: makeId('action'), versionId: input.versionId, actorId: input.actor.id, actorName: input.actor.name, actorRole: input.actor.role,
    kind: 'edit_wording', articleId: input.articleId, description: `Edited ${input.field} (${input.language}).`,
    before: input.before, after: input.after, at: now,
  };
  await logDraftAction(action);
  await logAuditEvent({
    id: makeId('audit'), kind: 'wording_edited', versionId: input.versionId, articleId: input.articleId,
    actorId: input.actor.id, actorName: input.actor.name, actorRole: input.actor.role,
    description: `${input.field} (${input.language}) edited for article ${input.articleId}.`,
    publicMetadata: { field: input.field, language: input.language, beforeLength: input.before.length, afterLength: input.after.length }, at: now,
  });
  return { action, change };
}

export async function selectArticleForVersion(versionId: string, articleId: string, actor: { id: string; name: string; role: DraftBuilderRole }): Promise<DraftBuilderAction> {
  requirePermission(actor.role, 'draft.create_version');
  const now = new Date().toISOString();
  const change: DraftChange = {
    id: makeId('dc'), versionId, kind: 'added', articleId,
    description: `Article ${articleId} selected for inclusion in version.`,
    actorId: actor.id, actorName: actor.name, at: now,
  };
  await appendDraftChange(versionId, change);
  const action: DraftBuilderAction = {
    id: makeId('action'), versionId, actorId: actor.id, actorName: actor.name, actorRole: actor.role,
    kind: 'select_article', articleId, description: `Selected article ${articleId} for draft.`, at: now,
  };
  await logDraftAction(action);
  return action;
}

export async function assignArticleNumber(versionId: string, articleId: string, newNumber: string, actor: { id: string; name: string; role: DraftBuilderRole }): Promise<DraftBuilderAction> {
  requirePermission(actor.role, 'draft.create_version');
  if (!newNumber.trim()) throw new Error('Article number cannot be empty.');
  const now = new Date().toISOString();
  const change: DraftChange = {
    id: makeId('dc'), versionId, kind: 'renumbered', articleId,
    description: `Article ${articleId} renumbered to ${newNumber}.`,
    actorId: actor.id, actorName: actor.name, at: now,
  };
  await appendDraftChange(versionId, change);
  const action: DraftBuilderAction = {
    id: makeId('action'), versionId, actorId: actor.id, actorName: actor.name, actorRole: actor.role,
    kind: 'assign_article_number', articleId, description: `Assigned article number ${newNumber} to ${articleId}.`,
    after: newNumber, at: now,
  };
  await logDraftAction(action);
  return action;
}

export async function reorderChapter(versionId: string, chapterId: string, newOrder: number, actor: { id: string; name: string; role: DraftBuilderRole }): Promise<DraftBuilderAction> {
  requirePermission(actor.role, 'draft.create_version');
  const now = new Date().toISOString();
  const change: DraftChange = {
    id: makeId('dc'), versionId, kind: 'moved', articleId: '',
    description: `Chapter ${chapterId} moved to position ${newOrder}.`,
    actorId: actor.id, actorName: actor.name, at: now,
  };
  await appendDraftChange(versionId, change);
  const action: DraftBuilderAction = {
    id: makeId('action'), versionId, actorId: actor.id, actorName: actor.name, actorRole: actor.role,
    kind: 'reorder_chapter', chapterId, description: `Chapter ${chapterId} reordered to position ${newOrder}.`,
    after: String(newOrder), at: now,
  };
  await logDraftAction(action);
  return action;
}

export async function sendBackForDiscussion(versionId: string, articleId: string, reason: string, actor: { id: string; name: string; role: DraftBuilderRole }): Promise<DraftBuilderAction> {
  requirePermission(actor.role, 'draft.send_back');
  const now = new Date().toISOString();
  const change: DraftChange = {
    id: makeId('dc'), versionId, kind: 'removed', articleId,
    description: `Article ${articleId} sent back to discussion: ${reason}`,
    actorId: actor.id, actorName: actor.name, at: now,
  };
  await appendDraftChange(versionId, change);
  const action: DraftBuilderAction = {
    id: makeId('action'), versionId, actorId: actor.id, actorName: actor.name, actorRole: actor.role,
    kind: 'send_back_for_discussion', articleId, description: `Article ${articleId} sent back for discussion.`, after: reason, at: now,
  };
  await logDraftAction(action);
  return action;
}

export async function requestPoll(versionId: string, articleId: string, stage: string, actor: { id: string; name: string; role: DraftBuilderRole }): Promise<DraftBuilderAction> {
  requirePermission(actor.role, 'draft.request_poll');
  const now = new Date().toISOString();
  const action: DraftBuilderAction = {
    id: makeId('action'), versionId, actorId: actor.id, actorName: actor.name, actorRole: actor.role,
    kind: 'request_poll', articleId, description: `Requested poll (stage: ${stage}) for article ${articleId}.`, after: stage, at: now,
  };
  await logDraftAction(action);
  return action;
}

export async function markLegallyReviewed(versionId: string, articleId: string, status: 'approved' | 'rejected' | 'returned_for_revision', notes: string, actor: { id: string; name: string; role: DraftBuilderRole }): Promise<DraftBuilderAction> {
  requirePermission(actor.role, 'draft.review_legal');
  const now = new Date().toISOString();
  const change: DraftChange = {
    id: makeId('dc'), versionId, kind: 'modified', articleId,
    description: `Legal review: ${status}. Notes: ${notes}`,
    actorId: actor.id, actorName: actor.name, at: now,
  };
  await appendDraftChange(versionId, change);
  const action: DraftBuilderAction = {
    id: makeId('action'), versionId, actorId: actor.id, actorName: actor.name, actorRole: actor.role,
    kind: 'mark_legally_reviewed', articleId, description: `Article ${articleId} marked as legally ${status}.`, after: notes, at: now,
  };
  await logDraftAction(action);
  await logAuditEvent({
    id: makeId('audit'), kind: 'legal_review_recorded', versionId, articleId,
    actorId: actor.id, actorName: actor.name, actorRole: actor.role,
    description: `Legal review for ${articleId}: ${status}.`,
    publicMetadata: { status, notesLength: notes.length }, at: now,
  });
  return action;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function appendDraftChange(versionId: string, change: DraftChange): Promise<void> {
  const list = await loadDraftVersions();
  const idx = list.findIndex(v => v.id === versionId);
  if (idx === -1) throw new Error('Draft version not found');
  const v = list[idx];
  if (v.immutable) throw new Error('Cannot modify an immutable (published) draft. Restore into a new version first.');
  const updated: DraftVersion = { ...v, changeLog: [...v.changeLog, change], lastUpdate: new Date().toISOString() };
  list[idx] = updated;
  await saveDraftVersions(list);
}

export async function loadDraftActions(versionId?: string): Promise<DraftBuilderAction[]> {
  try {
    const raw = await AsyncStorage.getItem(ACTIONS_KEY);
    const list: DraftBuilderAction[] = raw ? JSON.parse(raw) : [];
    return versionId ? list.filter(a => a.versionId === versionId) : list;
  } catch { return []; }
}

async function logDraftAction(action: DraftBuilderAction): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(ACTIONS_KEY);
    const list: DraftBuilderAction[] = raw ? JSON.parse(raw) : [];
    list.unshift(action);
    const trimmed = list.slice(0, 500);
    await AsyncStorage.setItem(ACTIONS_KEY, JSON.stringify(trimmed));
  } catch (e) { console.warn('[draft] action save failed', e); }
}

// ─── Approval workflow state ─────────────────────────────────────────────────

export async function loadApprovalWorkflow(articleId: string): Promise<ApprovalWorkflowState> {
  try {
    const raw = await AsyncStorage.getItem(WORKFLOW_KEY);
    const all: Record<string, ApprovalWorkflowState> = raw ? JSON.parse(raw) : {};
    if (all[articleId]) return all[articleId];
    // Default workflow state for an article.
    const state: ApprovalWorkflowState = {
      articleId,
      currentStage: 'citizen_input',
      stages: [
        { stage: 'citizen_input', status: 'completed' },
        { stage: 'moderation', status: 'completed' },
        { stage: 'clustering', status: 'completed' },
        { stage: 'legal_review', status: 'pending' },
        { stage: 'committee_approval', status: 'pending' },
        { stage: 'published', status: 'pending' },
        { stage: 'rejected', status: 'skipped' },
      ],
      rules: DEFAULT_APPROVAL_RULES,
    };
    return state;
  } catch {
    return {
      articleId,
      currentStage: 'citizen_input',
      stages: [],
      rules: DEFAULT_APPROVAL_RULES,
    };
  }
}

export async function saveApprovalWorkflow(state: ApprovalWorkflowState): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(WORKFLOW_KEY);
    const all: Record<string, ApprovalWorkflowState> = raw ? JSON.parse(raw) : {};
    all[state.articleId] = state;
    await AsyncStorage.setItem(WORKFLOW_KEY, JSON.stringify(all));
  } catch (e) { console.warn('[workflow] save failed', e); }
}

export async function advanceApprovalStage(articleId: string, decision: { stage: ApprovalStage; status: 'completed' | 'rejected'; by: { id: string; name: string; role: DraftBuilderRole }; rationale?: string }): Promise<ApprovalWorkflowState> {
  const state = await loadApprovalWorkflow(articleId);
  const updatedStages = state.stages.map(s =>
    s.stage === decision.stage
      ? { ...s, status: decision.status, decisionBy: decision.by.id, decisionAt: new Date().toISOString(), rationale: decision.rationale, notes: decision.rationale }
      : s
  );
  // Advance current stage
  const order: ApprovalStage[] = ['citizen_input', 'moderation', 'clustering', 'legal_review', 'committee_approval', 'published', 'rejected'];
  const idx = order.indexOf(decision.stage);
  const nextStage: ApprovalStage = decision.status === 'rejected' ? 'rejected' : order[Math.min(idx + 1, order.length - 1)];
  const updated: ApprovalWorkflowState = { ...state, stages: updatedStages, currentStage: nextStage };
  await saveApprovalWorkflow(updated);
  return updated;
}

export function evaluateApprovalEligibility(state: ApprovalWorkflowState, context: {
  verifiedParticipants: number;
  regionCount: number;
  pollsCompleted: import('../types').PollStageLike[];
  supportPercentage: number;
  legalReviewApproved: boolean;
}): { eligible: boolean; reasons: string[] } {
  const reasons: string[] = [];
  if (context.verifiedParticipants < state.rules.minimumVerifiedParticipants) reasons.push(`Verified participants below minimum (${context.verifiedParticipants}/${state.rules.minimumVerifiedParticipants}).`);
  if (context.regionCount < state.rules.minimumRegions) reasons.push(`Regions below minimum (${context.regionCount}/${state.rules.minimumRegions}).`);
  for (const stage of state.rules.requiredPollStages) if (!context.pollsCompleted.includes(stage)) reasons.push(`Required poll stage not completed: ${stage}.`);
  if (context.supportPercentage < state.rules.minimumSupportPercentage) reasons.push(`Support below minimum (${context.supportPercentage}/${state.rules.minimumSupportPercentage}%).`);
  if (state.rules.requireLegalReview && !context.legalReviewApproved) reasons.push('Legal review not approved.');
  if (state.rules.requireCommitteeApproval && state.currentStage !== 'committee_approval' && state.currentStage !== 'published') reasons.push(`Current stage is ${state.currentStage}, not committee_approval.`);
  return { eligible: reasons.length === 0, reasons };
}

// ─── Type re-exports ─────────────────────────────────────────────────────────

export type { DraftVersion, DraftChange, DraftBuilderAction, DraftBuilderActionKind, DraftBuilderRole, ApprovalWorkflowState, ApprovalRules, ApprovalStage, ProposedArticle, ProposedChapter };
