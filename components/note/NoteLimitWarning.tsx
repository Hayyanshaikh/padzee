"use client";

import { AlertCircle } from "lucide-react";
import { usePlan } from "@/hooks/use-plan";
import { PLAN_CONFIG, canCreateMoreNotes } from "@/lib/plan-config";

interface NoteLimitWarningProps {
  noteCount: number;
}

export function NoteLimitWarning({ noteCount }: NoteLimitWarningProps) {
  const { plan } = usePlan();
  const features = PLAN_CONFIG[plan];

  if (!features.maxNotes || noteCount < features.maxNotes) {
    return null; // Don't show if unlimited or haven't reached limit
  }

  return (
    <div className="bg-amber-50 border border-amber-200 rounded p-3 mb-4 flex gap-3">
      <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
      <div className="text-sm text-amber-900">
        <p className="font-medium mb-1">Note limit reached</p>
        <p className="text-amber-800">
          You've reached the maximum of {features.maxNotes} notes on the Free
          plan. Upgrade to Pro or Business to create unlimited notes.
        </p>
      </div>
    </div>
  );
}
