"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { GraduationCap, Bookmark, Check, UserCheck, CalendarCheck2 } from "lucide-react";
import { BatchItem, EnrolledBatch } from "@/types";

interface BatchCardProps {
  batch?: BatchItem;
  isPlaceholder?: boolean;
  priority?: boolean;
}

export default function BatchCard({
  batch,
  isPlaceholder = false,
  priority = false,
}: BatchCardProps) {
  const router = useRouter();
  const [isSaved, setIsSaved] = useState(false);
  const [mounted, setMounted] = useState(false);

  const id = batch?.batchId || batch?._id || "";
  const title = batch?.batchName || "";
  const image = batch?.batchImage || "/assets/img/video-placeholder.svg";
  const language = batch?.language || "Hinglish";
  const startDate = batch?.startDate || "";
  const endDate = batch?.endDate || "";
  const price = batch?.batchPrice ? batch.batchPrice.toFixed(0) : "0";
  const forText = batch?.byName || "";

  useEffect(() => {
    setMounted(true);
    if (!id) return;

    const checkSaved = () => {
      try {
        const raw = localStorage.getItem("enrolledBatches") || "[]";
        const enrolled: EnrolledBatch[] = JSON.parse(raw);
        setIsSaved(enrolled.some((b) => b.batchId === id));
      } catch {
        setIsSaved(false);
      }
    };

    checkSaved();
    window.addEventListener("batchesUpdated", checkSaved);
    return () => window.removeEventListener("batchesUpdated", checkSaved);
  }, [id]);

  const toggleSave = (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const raw = localStorage.getItem("enrolledBatches") || "[]";
      let list: EnrolledBatch[] = [];
      try {
        list = JSON.parse(raw);
        if (!Array.isArray(list)) list = [];
      } catch {
        list = [];
      }

      if (isSaved) {
        list = list.filter((b) => b.batchId !== id);
        localStorage.setItem("enrolledBatches", JSON.stringify(list));
        setIsSaved(false);
      } else {
        list.push({ batchId: id, name: title, enrolledAt: new Date().toISOString() });
        localStorage.setItem("enrolledBatches", JSON.stringify(list));
        setIsSaved(true);
      }

      window.dispatchEvent(new Event("batchesUpdated"));
    } catch (err) {
      console.error("Save error:", err);
    }
  };

  // Skeleton Placeholder
  if (isPlaceholder || !batch) {
    return (
      <div className="border rounded-xl p-4 space-y-4 animate-pulse bg-muted/60">
        <div className="h-6 bg-muted-foreground/20 rounded w-3/4" />
        <div className="h-48 bg-muted-foreground/20 rounded" />
        <div className="h-4 bg-muted-foreground/20 rounded w-1/2" />
        <div className="h-4 bg-muted-foreground/20 rounded w-3/4" />
        <div className="flex gap-2">
          <div className="h-8 bg-muted-foreground/20 rounded w-1/2" />
          <div className="h-8 bg-muted-foreground/20 rounded w-1/2" />
        </div>
      </div>
    );
  }

  return (
    <div className="border rounded-xl overflow-hidden hover:shadow-lg dark:border-gray-700 transition-shadow bg-white dark:bg-gray-900 flex flex-col justify-between">
      {/* Title & Badge */}
      <div className="p-4 pb-0 space-y-3 relative flex items-center justify-between w-full">
        <h2 className="line-clamp-2 text-base sm:text-lg font-bold text-foreground">
          {title}
        </h2>
        <div className="items-center !m-0 flex-shrink-0">
          <span className="bg-yellow-400 text-black text-xs px-2 py-1 rounded font-medium">
            New
          </span>
        </div>
      </div>

      <div className="w-full p-4 flex flex-col justify-between flex-1">
        {/* Thumbnail & Language Pill */}
        <div className="w-full rounded-lg overflow-hidden relative bg-muted/30 aspect-video">
          <Image
            src={image}
            alt={title}
            fill
            className="w-full h-full object-contain"
            priority={priority}
            unoptimized
          />
          <div className="absolute bottom-2 left-2 z-10">
            <span className="rounded-md bg-pink-500/80 text-white dark:bg-green-600/80 px-2 py-1 text-xs font-medium ring-1 ring-pink-700/20 ring-inset">
              {language}
            </span>
          </div>
        </div>

        {/* Info Rows */}
        <div className="pt-3 space-y-2.5 w-full">
          {/* Target Audience */}
          {forText ? (
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <UserCheck className="w-4 h-4 flex-shrink-0" />
              <span className="text-xs font-semibold text-foreground truncate">
                {forText}
              </span>
            </div>
          ) : (
            <div className="h-4" />
          )}

          {/* Dates */}
          <div className="flex items-center gap-1 text-muted-foreground text-xs flex-wrap">
            <CalendarCheck2 className="w-4 h-4 flex-shrink-0" />
            <span>Starts on</span>
            <span className="font-semibold text-foreground">{startDate || "Soon"}</span>
            <span>| Ends on</span>
            <span className="font-semibold text-foreground">{endDate || "Exam"}</span>
          </div>

          {/* Pricing Row */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <div>
              <span className="text-base sm:text-lg font-bold text-green-600 dark:text-green-400">
                ₹ FREE
              </span>
              {price !== "0" && (
                <span className="text-xs text-muted-foreground line-through ml-2">
                  ₹{price}
                </span>
              )}
            </div>
            <span className="text-xs bg-green-50 dark:bg-green-950 text-green-600 dark:text-green-300 border border-green-200 dark:border-green-800 px-2 py-1 rounded font-medium">
              100% Free For Students
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2 pt-2">
            <button
              onClick={() => router.push(`/study/batches/${id}`)}
              className="flex-1 min-w-[110px] inline-flex items-center justify-center border border-border rounded-lg text-xs sm:text-sm font-medium py-2 hover:bg-muted transition-colors text-foreground"
            >
              <GraduationCap className="w-4 h-4 mr-1.5" />
              Study
            </button>

            {mounted && isSaved ? (
              <button
                onClick={toggleSave}
                className="flex-1 min-w-[110px] inline-flex items-center justify-center border border-border bg-muted/60 text-foreground rounded-lg text-xs sm:text-sm font-medium py-2 hover:bg-muted transition-colors"
                title="Saved to My Batches"
              >
                <Check className="w-4 h-4 mr-1.5 text-green-600" />
                Saved
              </button>
            ) : (
              <button
                onClick={toggleSave}
                className="flex-1 min-w-[110px] inline-flex items-center justify-center bg-green-500 hover:bg-green-600 text-white rounded-lg text-xs sm:text-sm font-medium py-2 transition-colors"
              >
                <Bookmark className="w-4 h-4 mr-1.5" />
                Save Batch
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
