"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { GraduationCap, BookOpen, Layers, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();

  const navItems = [
    {
      title: "Study",
      href: "/study",
      icon: BookOpen,
      isActive: pathname === "/study",
    },
    {
      title: "Batches",
      href: "/study/batches",
      icon: Layers,
      isActive: pathname === "/study/batches",
    },
    {
      title: "My Batches",
      href: "/study/mybatches",
      icon: GraduationCap,
      isActive: pathname === "/study/mybatches",
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm xl:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          "z-50 w-64 bg-background border-r shadow-md transition-transform duration-200 ease-in-out fixed top-0 left-0 h-full flex flex-col xl:sticky xl:top-0 xl:translate-x-0 xl:h-screen xl:z-auto",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Brand Header */}
        <div className="p-4 border-b sticky top-0 bg-background z-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full dark:bg-foreground overflow-hidden flex-shrink-0 flex items-center justify-center">
              <Image
                src="/logo.png"
                alt="PW THOR"
                width={40}
                height={40}
                className="w-10 h-10 object-cover"
                priority
              />
            </div>
            <span className="font-semibold text-foreground tracking-tight">PW THOR</span>
            <GraduationCap className="w-5 h-5 text-foreground/80" />
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted xl:hidden"
            aria-label="Close Sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="p-2 space-y-1.5 overflow-y-auto flex-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors duration-200 cursor-pointer",
                  item.isActive
                    ? "bg-foreground/90 text-background font-semibold"
                    : "text-foreground hover:bg-foreground/10"
                )}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span>{item.title}</span>
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
