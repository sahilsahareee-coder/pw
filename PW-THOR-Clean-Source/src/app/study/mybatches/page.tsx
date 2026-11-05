"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { GraduationCap, BookOpen, PinOff, ArrowRight } from "lucide-react";
import { EnrolledBatch } from "@/types";

export default function MyBatchesPage() {
  const [enrolled, setEnrolled] = useState<EnrolledBatch[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const load = () => {
      try {
        const raw = localStorage.getItem("enrolledBatches") || "[]";
        const list: EnrolledBatch[] = JSON.parse(raw);
        setEnrolled(Array.isArray(list) ? list : []);
      } catch {
        setEnrolled([]);
      }
    };

    load();
    window.addEventListener("batchesUpdated", load);
    return () => window.removeEventListener("batchesUpdated", load);
  }, []);

  const handleUnenroll = async (id: string, name: string) => {
    try {
      await fetch("/api/UnenrollBatch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ batchId: id, name }),
      });
      const filtered = enrolled.filter((b) => b.batchId !== id);
      setEnrolled(filtered);
      localStorage.setItem("enrolledBatches", JSON.stringify(filtered));
      window.dispatchEvent(new Event("batchesUpdated"));
    } catch (err) {
      console.error("Failed to unenroll:", err);
    }
  };

  if (!mounted) return null;

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      <div className="bg-background border rounded-lg p-6 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b pb-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">My Enrolled Batches</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Quick access to your enrolled batches and courses
            </p>
          </div>
          <span className="text-xs bg-primary/10 text-primary font-bold px-3 py-1 rounded-full">
            {enrolled.length} Enrolled
          </span>
        </div>

        {enrolled.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {enrolled.map((item) => (
              <div
                key={item.batchId}
                className="border border-border rounded-xl p-5 bg-card flex flex-col justify-between hover:shadow-md transition-shadow space-y-4"
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                    <GraduationCap className="w-4 h-4 text-primary" />
                    <span>Enrolled Course</span>
                  </div>
                  <h3 className="font-bold text-lg text-foreground line-clamp-2">
                    {item.name || "Enrolled Batch"}
                  </h3>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-border">
                  <Link
                    href={`/study/batches/${item.batchId}`}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs sm:text-sm font-semibold bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
                  >
                    <BookOpen className="w-4 h-4" />
                    Study
                  </Link>

                  <button
                    onClick={() => handleUnenroll(item.batchId, item.name)}
                    className="inline-flex items-center justify-center p-2 rounded-lg text-xs border border-border text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                    title="Unenroll"
                  >
                    <PinOff className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 space-y-4">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto text-muted-foreground">
              <GraduationCap className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-foreground">No enrolled batches yet</h3>
            <p className="text-muted-foreground text-sm max-w-md mx-auto">
              Explore thousands of batches in the catalog and enroll with one click to keep track of
              them here.
            </p>
            <Link
              href="/study/batches"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              Browse Batches
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
