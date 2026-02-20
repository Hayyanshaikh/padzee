"use client";

import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const PLAN_DETAILS = {
  free: {
    name: "Free",
    price: "₹0",
    description: "Perfect for personal use",
  },
  pro: {
    name: "Pro",
    price: "₹299/month",
    description: "For power users",
  },
  business: {
    name: "Business",
    price: "₹999/month",
    description: "For teams and enterprises",
  },
};

export default function CheckoutPage() {
  const searchParams = useSearchParams();
  const plan = searchParams.get("plan") as keyof typeof PLAN_DETAILS;

  const details = PLAN_DETAILS[plan] || PLAN_DETAILS.free;

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <div className="max-w-2xl mx-auto px-4 py-20">
        <div className="mb-8">
          <Link
            href="/pricing"
            className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300 text-sm"
          >
            ← Back to Pricing
          </Link>
        </div>

        <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-8 sm:p-12 bg-white dark:bg-gray-900">
          <h1 className="text-3xl font-bold mb-2 text-gray-900 dark:text-white">
            {details.name}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {details.description}
          </p>

          <div className="mb-8 pb-8 border-b border-gray-200 dark:border-gray-800">
            <div className="text-4xl font-bold text-gray-900 dark:text-white">
              {details.price}
            </div>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded p-6 mb-8">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
              Coming Soon
            </h3>
            <p className="text-gray-700 dark:text-gray-400 text-sm">
              Payment processing is currently being set up. Get in touch with
              our team to subscribe to this plan.
            </p>
          </div>

          <div className="space-y-3 mb-8">
            <Button asChild className="w-full">
              <a href="mailto:support@padzee.com">Contact Us for Setup</a>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/pricing">Back to Pricing</Link>
            </Button>
          </div>

          <p className="text-xs text-gray-500 dark:text-gray-500 text-center">
            We'll get back to you within 24 hours to complete your setup
          </p>
        </div>
      </div>
    </div>
  );
}
