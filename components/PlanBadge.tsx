"use client";

import { usePlan } from "@/hooks/use-plan";
import { PLAN_CONFIG } from "@/lib/plan-config";

export function PlanBadge() {
  const { plan } = usePlan();

  const badgeColor = {
    free: "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700",
    pro: "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800",
    business:
      "bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800",
  };

  return (
    <div className="border-t border-gray-200 dark:border-gray-800 py-4 mt-6">
      <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2 uppercase">
        Your Plan
      </p>
      <div
        className={`flex items-center justify-between gap-2 px-3 py-1.5 rounded-full text-sm font-medium border ${
          badgeColor[plan]
        }`}
      >
        {plan === "free" ? "Free" : plan === "pro" ? "Pro" : "Business"} Plan
        <span className="ml-2 text-xs opacity-75">
          {PLAN_CONFIG[plan].maxNotes
            ? `${PLAN_CONFIG[plan].maxNotes} notes`
            : "∞ notes"}
        </span>
      </div>
    </div>
  );
}
