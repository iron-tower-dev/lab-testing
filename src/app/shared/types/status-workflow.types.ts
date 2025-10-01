/**
 * Status Workflow Types
 * Phase 2: Status Workflow System Implementation
 * 
 * Defines the complete 8-state workflow for test result entry:
 * X (Not Started) → A (Awaiting) → T (Training) → P (Partial) → 
 * E (Entry Complete) → S (Saved) → D (Done) → C (Complete)
 */

/**
 * Test result status codes from VB.NET legacy system
 */
export enum TestStatus {
  NOT_STARTED = 'X',
  AWAITING = 'A',
  TRAINING = 'T',
  PARTIAL = 'P',
  ENTRY_COMPLETE = 'E',
  SAVED = 'S',
  DONE = 'D',
  COMPLETE = 'C'
}

/**
 * Display information for each status
 */
export interface StatusInfo {
  code: TestStatus;
  label: string;
  description: string;
  color: string;
  icon: string;
  isFinal: boolean;
}

/**
 * Valid status transitions
 */
export interface StatusTransition {
  from: TestStatus;
  to: TestStatus;
  action: string;
  requiresQualification?: string[];
  conditions?: string[];
}

/**
 * Action buttons available for a status
 */
export interface StatusAction {
  action: 'save' | 'partial-save' | 'media-ready' | 'accept' | 'reject' | 'delete' | 'clear';
  label: string;
  icon?: string;
  requiresQualification?: string[];
  requiresCondition?: (context: ActionContext) => boolean;
}

/**
 * User qualification levels for test authorization
 */
export type UserQualification = 'TRAIN' | 'Q' | 'QAG' | 'MicrE';

/**
 * Context for determining available actions
 */
export interface ActionContext {
  testId: number;
  sampleId: number;
  currentStatus: TestStatus;
  userQualification: UserQualification | string | null;  // string for compatibility with legacy values
  enteredBy: string | null;
  currentUser: string;
  mode: 'entry' | 'review' | 'view';
  isPartialSave: boolean;
  isTraining: boolean;
}

/**
 * Result of status transition attempt
 */
export interface StatusTransitionResult {
  success: boolean;
  newStatus: TestStatus;
  message?: string;
  requiresAdditionalAction?: boolean;
}

/**
 * Status transition request payload
 */
export interface StatusTransitionRequest {
  sampleId: number;
  testId: number;
  newStatus: TestStatus;
  userId: string;
  action: 'save' | 'partial-save' | 'accept' | 'reject' | 'delete' | 'media-ready';
}

/**
 * Status info response from API
 */
export interface StatusInfoResponse {
  success: boolean;
  status?: TestStatus;
  entryId?: string | null;
  validateId?: string | null;
  entryDate?: number | null;
  valiDate?: number | null;
  error?: string;
  message?: string;
}
