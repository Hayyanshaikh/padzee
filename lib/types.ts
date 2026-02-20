export type PlanType = "free" | "pro" | "business";

export interface Note {
  id: string;
  title: string;
  content: string;
  slug: string;
  createdAt: string;
  updatedAt: string;
  ownerFingerprint?: string;
  lockMode?: "none" | "hard" | "password";
  lockPasswordHash?: string | null;
  lockedAt?: string;
}

export interface NoteFormData {
  title: string;
  content: string;
  slug: string;
}
