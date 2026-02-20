import { useState, useEffect } from "react";
import { PlanType } from "@/lib/types";

export function usePlan() {
  const [plan, setPlan] = useState<PlanType>("free");
  const [isLoading, setIsLoading] = useState(true);

  // Load plan from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("userPlan");
    if (
      stored &&
      (stored === "free" || stored === "pro" || stored === "business")
    ) {
      setPlan(stored as PlanType);
    }
    setIsLoading(false);
  }, []);

  // Save plan to localStorage
  const updatePlan = (newPlan: PlanType) => {
    setPlan(newPlan);
    localStorage.setItem("userPlan", newPlan);
  };

  return {
    plan,
    updatePlan,
    isLoading,
  };
}
