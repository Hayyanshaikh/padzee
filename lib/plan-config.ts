import { PlanType } from "@/lib/types";

// Plan configuration
export const PLAN_CONFIG: Record<
  PlanType,
  {
    maxNotes: number | null;
    retentionDays: number | null;
    canExport: boolean;
    canSharePrivate: boolean;
    canSetPassword: boolean;
    richEditor: boolean;
    teamCollaboration: boolean;
    apiAccess: boolean;
  }
> = {
  free: {
    maxNotes: 5,
    retentionDays: 7,
    canExport: false,
    canSharePrivate: false,
    canSetPassword: false,
    richEditor: false,
    teamCollaboration: false,
    apiAccess: false,
  },
  pro: {
    maxNotes: null, // unlimited
    retentionDays: 365, // 1 year
    canExport: true,
    canSharePrivate: true,
    canSetPassword: true,
    richEditor: true,
    teamCollaboration: false,
    apiAccess: false,
  },
  business: {
    maxNotes: null, // unlimited
    retentionDays: null, // unlimited
    canExport: true,
    canSharePrivate: true,
    canSetPassword: true,
    richEditor: true,
    teamCollaboration: true,
    apiAccess: true,
  },
};

// Get plan features
export function getPlanFeatures(plan: PlanType) {
  return PLAN_CONFIG[plan];
}

// Check if user can create more notes
export function canCreateMoreNotes(
  plan: PlanType,
  currentNoteCount: number,
): boolean {
  const features = PLAN_CONFIG[plan];
  if (features.maxNotes === null) return true; // unlimited
  return currentNoteCount < features.maxNotes;
}

// Check if note should be deleted based on retention
export function shouldDeleteNote(plan: PlanType, createdAt: Date): boolean {
  const features = PLAN_CONFIG[plan];
  if (features.retentionDays === null) return false; // unlimited retention

  const now = new Date();
  const ageInDays =
    (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
  return ageInDays > features.retentionDays;
}
