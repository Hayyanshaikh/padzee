"use client";

import { usePlan } from "@/hooks/use-plan";
import { Button } from "@/components/ui/button";
import { PLAN_CONFIG } from "@/lib/plan-config";

export function PlanSwitcher() {
  const { plan, updatePlan } = usePlan();

  return (
    <div className="border-t border-gray-200 dark:border-gray-800 p-4 mt-6">
      <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-3 uppercase">
        Dev Mode
      </p>
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-medium capitalize text-gray-900 dark:text-white">
          {plan}
        </span>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          Max {PLAN_CONFIG[plan].maxNotes || "∞"} notes
        </span>
      </div>
      <div className="grid grid-cols-3 gap-2 text-xs">
        <Button
          variant={plan === "free" ? "default" : "outline"}
          size="sm"
          onClick={() => updatePlan("free")}
          className="text-xs"
        >
          Free
        </Button>
        <Button
          variant={plan === "pro" ? "default" : "outline"}
          size="sm"
          onClick={() => updatePlan("pro")}
          className="text-xs"
        >
          Pro
        </Button>
        <Button
          variant={plan === "business" ? "default" : "outline"}
          size="sm"
          onClick={() => updatePlan("business")}
          className="text-xs"
        >
          Business
        </Button>
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
        Switch plans to test features
      </p>
    </div>
  );
}
