"use client";

import React, { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Video, ArrowLeft, BookOpen, Layers } from "lucide-react";
import VideoPlayer from "@/components/VideoPlayer";
import { extractLectureVideoSource } from "@/lib/video";

function WatchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const batchId = searchParams.get("batchId") || searchParams.get("BatchId") || "";
  const subjectId = searchParams.get("subjectId") || searchParams.get("SubjectId") || "";
  const childId = searchParams.get("childId") || searchParams.get("ChildId") || "lecture";
  const type = searchParams.get("type") || searchParams.get("Type") || "";
  const rawVideoUrl =
    searchParams.get("videoUrl") ||
    searchParams.get("VideoUrl") ||
    searchParams.get("url") ||
    searchParams.get("v") ||
    "";
  const title = searchParams.get("title") || searchParams.get("name") || "Lecture Video";

  const extracted = extractLectureVideoSource({
    url: rawVideoUrl,
    urlType: type,
    type,
  });

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Top Navbar */}
      <header className="border-b bg-background/95 backdrop-blur sticky top-0 z-30 px-4 py-3">
        <div className="container mx-auto max-w-7xl flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {batchId ? (
              <Link
                href={`/study/batches/${batchId}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border hover:bg-muted text-xs font-semibold transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Batch</span>
              </Link>
            ) : (
              <button
                onClick={() => router.back()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border hover:bg-muted text-xs font-semibold transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
            )}

            <div className="min-w-0">
              <h1 className="text-sm sm:text-base font-bold text-foreground truncate">{title}</h1>
              <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Video className="w-3 h-3 text-primary" />
                  <span>{extracted.type.toUpperCase()} Lecture</span>
                </span>
                {batchId && (
                  <>
                    <span>•</span>
                    <span className="font-mono truncate">Batch: {batchId.slice(0, 10)}...</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/study/batches"
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-muted text-xs text-muted-foreground hover:text-foreground font-medium transition-colors"
            >
              <Layers className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">All Batches</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Video Viewing Area */}
      <main className="container mx-auto max-w-6xl px-4 py-6 flex-1 space-y-6">
        {extracted.url ? (
          <div className="space-y-4">
            <VideoPlayer
              src={extracted.url}
              title={title}
              lectureId={childId}
              autoPlay={true}
            />

            {/* Lecture Details Bar */}
            <div className="bg-card border border-border rounded-xl p-5 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-foreground">{title}</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Stream format: <span className="font-semibold text-foreground uppercase">{extracted.type}</span>
                  </p>
                </div>

                {batchId && (
                  <Link
                    href={`/study/batches/${batchId}`}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition-opacity"
                  >
                    <BookOpen className="w-4 h-4" />
                    <span>View All Batch Chapters</span>
                  </Link>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="py-20 text-center space-y-4 max-w-md mx-auto">
            <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mx-auto text-muted-foreground">
              <Video className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-foreground">No Video Source Specified</h3>
            <p className="text-xs text-muted-foreground">
              Please navigate to a lecture from the batch curriculum to launch the video player.
            </p>
            <Link
              href="/study/batches"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold"
            >
              Back to Batches
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}

export default function WatchPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background">
          <p className="text-sm text-muted-foreground">Loading video stream...</p>
        </div>
      }
    >
      <WatchContent />
    </Suspense>
  );
}
