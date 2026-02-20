"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";

const PLANS = [
  {
    id: "free",
    name: "Free",
    price: "₹0",
    features: [
      "Up to 5 notes",
      "Basic text editor",
      "Share with URL",
      "7 days retention",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    price: "₹299",
    period: "/month",
    features: [
      "Unlimited notes",
      "Rich text editor",
      "Password protection",
      "1 year retention",
      "Export notes",
    ],
    popular: true,
  },
  {
    id: "business",
    name: "Business",
    price: "₹999",
    period: "/month",
    features: [
      "All Pro features",
      "Team collaboration",
      "API access",
      "Unlimited retention",
      "Priority support",
    ],
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      {/* Hero Section */}
      <div className="max-w-4xl mx-auto px-4 py-20">
        <div className="mb-16">
          <h1 className="text-4xl font-bold mb-4 text-gray-900 dark:text-white">
            Simple Pricing
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Choose the plan that fits your needs. No hidden fees. Cancel
            anytime.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-20">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              className={`border rounded p-8 transition-all ${
                plan.popular
                  ? "border-gray-900 dark:border-white bg-gray-50 dark:bg-gray-900 md:scale-105 md:-translate-y-4"
                  : "border-gray-200 dark:border-gray-800 hover:border-gray-400 dark:hover:border-gray-600 bg-white dark:bg-gray-900"
              }`}
            >
              {plan.popular && (
                <div className="mb-4 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                  Most Popular
                </div>
              )}

              <h2 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">
                {plan.name}
              </h2>

              <div className="mb-6">
                <span className="text-3xl font-bold text-gray-900 dark:text-white">
                  {plan.price}
                </span>
                {plan.period && (
                  <span className="text-gray-600 dark:text-gray-400 text-sm ml-1">
                    {plan.period}
                  </span>
                )}
              </div>

              <Button
                asChild
                variant={plan.popular ? "default" : "outline"}
                className="w-full mb-8"
              >
                <Link href={`/pricing/checkout?plan=${plan.id}`}>
                  Get Started
                </Link>
              </Button>

              <ul className="space-y-3">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm">
                    <span className="text-gray-400 dark:text-gray-500 mt-1">
                      →
                    </span>
                    <span className="text-gray-700 dark:text-gray-300">
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Features Comparison Section */}
        <div className="border-t border-gray-200 dark:border-gray-800 pt-16 mt-20">
          <h2 className="text-2xl font-bold mb-8 text-gray-900 dark:text-white">
            What's included
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="font-semibold mb-4 text-lg text-gray-900 dark:text-white">
                All plans include
              </h3>
              <ul className="space-y-3 text-gray-700 dark:text-gray-300">
                <li className="flex gap-2">
                  <span>✓</span> <span>Create and edit notes</span>
                </li>
                <li className="flex gap-2">
                  <span>✓</span> <span>Share via unique URL</span>
                </li>
                <li className="flex gap-2">
                  <span>✓</span> <span>Auto-save functionality</span>
                </li>
                <li className="flex gap-2">
                  <span>✓</span> <span>Clean, minimal interface</span>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4 text-lg text-gray-900 dark:text-white">
                Pro & Business
              </h3>
              <ul className="space-y-3 text-gray-700 dark:text-gray-300">
                <li className="flex gap-2">
                  <span>✓</span> <span>Password-protected notes</span>
                </li>
                <li className="flex gap-2">
                  <span>✓</span> <span>Longer content retention</span>
                </li>
                <li className="flex gap-2">
                  <span>✓</span> <span>Advanced features</span>
                </li>
                <li className="flex gap-2">
                  <span>✓</span> <span>Priority support</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="border-t border-gray-200 dark:border-gray-800 pt-16 mt-20">
          <h2 className="text-2xl font-bold mb-8 text-gray-900 dark:text-white">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            <div>
              <h4 className="font-semibold mb-2 text-gray-900 dark:text-white">
                Can I upgrade or downgrade?
              </h4>
              <p className="text-gray-700 dark:text-gray-400">
                Yes, you can change your plan anytime. Changes take effect
                immediately for upgrades, or at the end of your billing cycle
                for downgrades.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2 text-gray-900 dark:text-white">
                Do you offer refunds?
              </h4>
              <p className="text-gray-700 dark:text-gray-400">
                We offer a 30-day money-back guarantee on your first month if
                you're not satisfied.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2 text-gray-900 dark:text-white">
                What about data security?
              </h4>
              <p className="text-gray-700 dark:text-gray-400">
                All notes are encrypted and stored securely. Pro and Business
                plans include password protection for additional security.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2 text-gray-900 dark:text-white">
                Do you accept international payments?
              </h4>
              <p className="text-gray-700 dark:text-gray-400">
                Yes! Contact us at support@padzee.com to discuss payment options
                for your region.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
