"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X, FileText, DollarSign } from "lucide-react";
import { PlanBadge } from "@/components/PlanBadge";
import { ThemeToggle } from "@/components/ThemeToggle";
import { PlanSwitcher } from "@/components/PlanSwitcher";

interface MenuItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  hide: boolean;
}

const menuItems: MenuItem[] = [
  {
    label: "Notes",
    href: "/note/new",
    icon: <FileText className="w-4 h-4" />,
    hide: false,
  },
  {
    label: "Pricing",
    href: "/pricing",
    icon: <DollarSign className="w-4 h-4" />,
    hide: true,
  },
];

export function Navbar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const isActive = (path: string) => {
    return pathname.startsWith(path);
  };

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  return (
    <>
      {/* Hamburger Button - Fixed */}
      <button
        onClick={toggleSidebar}
        className="fixed top-4 left-4 z-50 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
        aria-label="Toggle menu"
      >
        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Theme Toggle - Top Right */}
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-30"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-screen w-56 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 z-40 transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-4 pt-14 h-full flex flex-col">
          {/* Logo */}
          <Link
            href="/note/new"
            className="block text-lg font-semibold px-2 mb-4 text-gray-900 dark:text-white"
            onClick={() => setIsOpen(false)}
          >
            Padzee
          </Link>

          {/* Navigation Links */}
          <nav className="space-y-1 flex-1">
            {menuItems
              .filter((ft) => !ft.hide)
              .map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2 text-sm rounded transition-colors ${
                    isActive(item.href)
                      ? "bg-gray-100 dark:bg-gray-800 font-medium text-gray-900 dark:text-white"
                      : "text-gray-700 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                  }`}
                >
                  {item.icon}
                  {item.label}
                </Link>
              ))}
          </nav>

          {/* User Section */}
          {/* <PlanBadge /> */}

          {/* Plan Switcher - Dev Mode */}
          {/* <PlanSwitcher /> */}

          {/* Footer Links */}
          <div className="space-y-1 text-xs">
            <a
              href="mailto:support@padzee.com"
              className="block mb-2 text-gray-600 dark:text-gray-500 hover:text-gray-900 dark:hover:text-gray-300 transition-colors px-1"
            >
              Support
            </a>
            <p className="text-gray-400 dark:text-gray-600 px-1">
              © 2026 Padzee
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}
