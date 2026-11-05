"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  Calendar,
  Layers,
  BookOpen,
  BookmarkPlus,
  Check,
  Clock,
  Info,
  Loader2,
  Lock,
  AlertCircle,
  RotateCw,
  User,
  PlayCircle,
  FileText,
  Play,
  Video,
  Download,
  HelpCircle,
  ExternalLink,
  Smartphone,
} from "lucide-react";
import {
  BatchDetailData,
  BatchDetailSubject,
  EnrolledBatch,
  TopicItem,
  LectureItem,
} from "@/types";
import { formatDate } from "@/lib/utils";
import VideoPlayer from "@/components/VideoPlayer";
import { extractLectureVideoSource } from "@/lib/video";
import { useAuth } from "@/components/AuthContext";

interface ErrorState {
  status?: number;
  errorType: string;
  message: string;
}

export default function BatchDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const { isAuthenticated, token, openLoginModal } = useAuth();

  const [batch, setBatch] = useState<BatchDetailData | null>(null);
  const [activeTab, setActiveTab] = useState<"subjects" | "description" | "streaming">("subjects");
  const [isLoading, setIsLoading] = useState(true);
  const [errorState, setErrorState] = useState<ErrorState | null>(null);
  const [isSaved, setIsSaved] = useState(false);

  // Today's Scheduled Classes (PW Thor feature)
  const [todayClasses, setTodayClasses] = useState<any[]>([]);
  const [isLoadingSchedule, setIsLoadingSchedule] = useState(false);

  // Subject & Chapter Inspection State
  const [selectedSubject, setSelectedSubject] = useState<BatchDetailSubject | null>(null);
  const [subjectTopics, setSubjectTopics] = useState<TopicItem[]>([]);
  const [isLoadingTopics, setIsLoadingTopics] = useState(false);
  const [topicsUnavailable, setTopicsUnavailable] = useState(false);

  // Chapter Content (Lectures, Notes, DPPs) State
  const [selectedTopic, setSelectedTopic] = useState<TopicItem | null>(null);
  const [contentTab, setContentTab] = useState<"videos" | "notes" | "exercises">("videos");
  const [topicContents, setTopicContents] = useState<LectureItem[]>([]);
  const [isLoadingContents, setIsLoadingContents] = useState(false);
  const [contentUnavailable, setContentUnavailable] = useState(false);

  // Active Video Player State & Ref
  const videoPlayerRef = useRef<HTMLDivElement>(null);
  const [activeVideo, setActiveVideo] = useState<{
    src: string;
    title: string;
    lectureId: string;
  } | null>(null);

  // Sync saved / enrolled batch state from localStorage
  useEffect(() => {
    if (!id) return;
    try {
      const raw = localStorage.getItem("enrolledBatches") || "[]";
      const list: EnrolledBatch[] = JSON.parse(raw);
      setIsSaved(list.some((b) => b.batchId === id));
    } catch {
      setIsSaved(false);
    }
  }, [id]);

  // Fetch batch details
  const fetchBatchDetails = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    setErrorState(null);

    let lastError: ErrorState | null = null;

    try {
      const res = await fetch(`/api/BatchInfo?BatchId=${id}&Type=details`);
      const json = await res.json().catch(() => null);

      if (res.ok && json?.success && json?.data) {
        setBatch(json.data);
        setIsLoading(false);
        return;
      }

      const status = res.status;
      const msg = json?.message || `API error (${status})`;
      const errorType =
        json?.errorType ||
        (status === 404 ? "NOT_FOUND" : status === 401 || status === 403 ? "UNAUTHORIZED" : "SERVER_ERROR");
      lastError = { status, errorType, message: msg };
    } catch (err: any) {
      console.warn("Local BatchInfo proxy unreachable, trying direct client fetch...", err);
      lastError = {
        status: 0,
        errorType: "NETWORK_ERROR",
        message: err.message || "Local proxy error",
      };
    }

    // Direct client fallback
    if (lastError?.status !== 404 && lastError?.status !== 401 && lastError?.status !== 403) {
      try {
        const directUrl = `https://api.penpencil.co/v3/batches/${id}/details`;
        const directRes = await fetch(directUrl, {
          method: "GET",
          headers: {
            accept: "application/json",
            "client-id": "5eb393ee95fab7468a79d189",
            "client-type": "WEB",
            "client-version": "2.2.7",
            origin: "https://www.pw.live",
            referer: "https://www.pw.live/",
            randomid: "4bb61dbd-bc60-4a20-a1aa-44e7c0c8e0ec",
          },
        });

        const directJson = await directRes.json().catch(() => null);

        if (directRes.ok && directJson?.success && directJson?.data) {
          setBatch(directJson.data);
          setIsLoading(false);
          return;
        }
      } catch (directErr: any) {
        console.error("Direct PenPencil fetch failed:", directErr);
      }
    }

    setErrorState(
      lastError || {
        status: 500,
        errorType: "UNKNOWN",
        message: "Unable to retrieve batch details.",
      }
    );
    setIsLoading(false);
  }, [id]);

  useEffect(() => {
    fetchBatchDetails();
  }, [fetchBatchDetails]);

  // Fetch Today's Scheduled Classes
  useEffect(() => {
    if (!id) return;
    let isMounted = true;
    setIsLoadingSchedule(true);

    fetch(`/api/todays-schedule?batchId=${id}`)
      .then((res) => res.json())
      .then((json) => {
        if (isMounted) {
          if (json?.success && Array.isArray(json.data)) {
            setTodayClasses(json.data.filter((c: any) => c.urlType && c.urlType !== ""));
          } else {
            setTodayClasses([]);
          }
        }
      })
      .catch(() => {
        if (isMounted) setTodayClasses([]);
      })
      .finally(() => {
        if (isMounted) setIsLoadingSchedule(false);
      });

    return () => {
      isMounted = false;
    };
  }, [id]);

  // Toggle Save to My Batches
  const toggleSave = () => {
    if (!batch) return;
    const name = batch.name || batch.byName || batch.slug || "Batch";

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
        list.push({ batchId: id, name, enrolledAt: new Date().toISOString() });
        localStorage.setItem("enrolledBatches", JSON.stringify(list));
        setIsSaved(true);
      }
      window.dispatchEvent(new Event("batchesUpdated"));
    } catch (err) {
      console.error("Save error:", err);
    }
  };

  // Inspect Subject & Check Chapters
  const handleInspectSubject = async (sub: BatchDetailSubject) => {
    setSelectedSubject(sub);
    setSelectedTopic(null);
    setTopicContents([]);
    setIsLoadingTopics(true);
    setTopicsUnavailable(false);
    setSubjectTopics([]);

    try {
      const subjectKey = encodeURIComponent(sub.slug || sub._id || sub.subjectId || "");
      const slugKey = encodeURIComponent(sub.slug || "");
      const idKey = encodeURIComponent(sub._id || sub.subjectId || "");
      const res = await fetch(`/api/SubjectInfo?BatchId=${id}&SubjectId=${subjectKey}&slug=${slugKey}&id=${idKey}`);
      const json = await res.json().catch(() => null);

      if (res.ok && json?.success && Array.isArray(json?.data)) {
        setSubjectTopics(json.data);
        setTopicsUnavailable(false);
      } else {
        setTopicsUnavailable(true);
      }
    } catch (err) {
      setTopicsUnavailable(true);
    } finally {
      setIsLoadingTopics(false);
    }
  };

  // Inspect Topic Contents (Lectures, Notes, DPPs)
  const handleInspectTopic = async (topic: TopicItem, type: "videos" | "notes" | "exercises" = contentTab) => {
    if (!selectedSubject) return;
    setSelectedTopic(topic);
    setContentTab(type);
    setIsLoadingContents(true);
    setTopicContents([]);
    setContentUnavailable(false);

    try {
      const subjectKey = encodeURIComponent(selectedSubject.slug || selectedSubject._id || selectedSubject.subjectId || "");
      const subjectMongoId = encodeURIComponent(selectedSubject._id || "");
      const masterSubjectId = encodeURIComponent(selectedSubject.subjectId || "");
      const subjectSlug = encodeURIComponent(selectedSubject.slug || "");

      const topicKey = encodeURIComponent(topic.slug || topic._id || "");
      const topicSlugKey = encodeURIComponent(topic.slug || "");
      const topicIdKey = encodeURIComponent(topic._id || "");

      const authToken = token || (typeof window !== "undefined" ? localStorage.getItem("pws_auth_token") : null);
      const headers: Record<string, string> = {};
      if (authToken) {
        headers["Authorization"] = `Bearer ${authToken}`;
      }

      const res = await fetch(
        `/api/TopicInfo?BatchId=${id}&SubjectId=${subjectKey}&subjectMongoId=${subjectMongoId}&masterSubjectId=${masterSubjectId}&subjectSlug=${subjectSlug}&TopicId=${topicKey}&topicSlug=${topicSlugKey}&topicId=${topicIdKey}&ContentType=${type}${authToken ? `&token=${encodeURIComponent(authToken)}` : ""}`,
        { headers }
      );
      const json = await res.json().catch(() => null);

      if (res.ok && json?.success) {
        if (Array.isArray(json?.data) && json.data.length > 0) {
          setTopicContents(json.data);
          setContentUnavailable(false);
        } else if (json.isLocked) {
          setTopicContents([]);
          setContentUnavailable(true);
        } else {
          setTopicContents([]);
          setContentUnavailable(false);
        }
      } else {
        setContentUnavailable(true);
      }
    } catch (err) {
      setContentUnavailable(true);
    } finally {
      setIsLoadingContents(false);
    }
  };

  // Re-fetch topic contents when auth state updates
  useEffect(() => {
    if (selectedTopic && selectedSubject) {
      handleInspectTopic(selectedTopic, contentTab);
    }
  }, [isAuthenticated, token]);

  // Play a lecture in the video player (Supports YouTube, HLS, MP4, and iframes)
  const handlePlayLecture = (lec: LectureItem | any) => {
    const extracted = extractLectureVideoSource(lec);
    const title = lec.name || lec.topic || "Lecture Video";

    if (extracted.url) {
      setActiveVideo({
        src: extracted.url,
        title,
        lectureId: lec._id || "lecture",
      });
      setTimeout(() => {
        videoPlayerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 50);
    }
  };

  // Compute total chapter counts across loaded topics
  const totalVideos = subjectTopics.reduce((acc, t) => acc + (t.videos || t.videosCount || 0), 0);
  const totalExercises = subjectTopics.reduce((acc, t) => acc + (t.exercises || t.dppsCount || 0), 0);
  const totalNotes = subjectTopics.reduce((acc, t) => acc + (t.notes || t.notesCount || 0), 0);

  // Loading Screen
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-24 text-center max-w-lg">
        <Loader2 className="w-10 h-10 animate-spin mx-auto text-primary" />
        <h3 className="mt-4 text-lg font-bold text-foreground">Loading Batch Details</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Fetching official curriculum, syllabus, and faculty details...
        </p>
      </div>
    );
  }

  // Error Screen
  if (errorState || !batch) {
    const isNotFound = errorState?.status === 404 || errorState?.errorType === "NOT_FOUND";

    return (
      <div className="container mx-auto px-4 py-16 max-w-2xl">
        <div className="bg-background border rounded-2xl p-8 text-center space-y-5 shadow-sm">
          {isNotFound ? (
            <div className="w-14 h-14 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center mx-auto">
              <Info className="w-7 h-7" />
            </div>
          ) : (
            <div className="w-14 h-14 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center mx-auto">
              <AlertCircle className="w-7 h-7" />
            </div>
          )}

          <div className="space-y-2">
            <h2 className="text-xl font-bold text-foreground">
              {isNotFound ? "Batch Not Found" : "Unable to Load Batch"}
            </h2>
            <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
              {errorState?.message || "Batch information could not be retrieved from the catalog."}
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={() => fetchBatchDetails()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              <RotateCw className="w-4 h-4" />
              <span>Retry</span>
            </button>

            <button
              onClick={() => router.push("/study/batches")}
              className="px-4 py-2 rounded-lg border text-sm font-semibold hover:bg-muted transition-colors text-foreground"
            >
              Back to Batches
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Derive batch values
  const title = batch.name || batch.byName || batch.slug || "Batch Details";
  const subjects = batch.subjects || [];

  return (
    <div className="min-w-0 flex-1">
      <div className="container mx-auto px-4 py-6 max-w-7xl space-y-6">
        {/* Top Hero Section */}
        <div className="flex flex-col md:flex-row gap-6 p-6 border border-border rounded-2xl bg-card">
          <div className="flex-1 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              {batch.language && (
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                  {batch.language}
                </span>
              )}
              {batch.class && (
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-muted text-muted-foreground border border-border">
                  Class: {batch.class}
                </span>
              )}
              {batch.status && (
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  {batch.status}
                </span>
              )}
            </div>

            <h1 className="text-2xl md:text-3xl font-black text-foreground tracking-tight">
              {title}
            </h1>

            {batch.batchCode && (
              <p className="text-xs font-mono text-muted-foreground">
                Batch Code: {batch.batchCode}
              </p>
            )}

            {/* Quick Metadata Stats */}
            <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground pt-2">
              <div className="flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-foreground/70" />
                <span>{subjects.length} Subjects</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-foreground/70" />
                <span>Starts: {formatDate(batch.startDate)}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-foreground/70" />
                <span>Validity: Till Exam</span>
              </div>
            </div>
          </div>

          {/* Pricing & Enrollment Box */}
          <div className="md:w-80 flex flex-col justify-between border border-border rounded-xl p-5 bg-card/50 space-y-4">
            <div>
              <span className="text-xs text-muted-foreground uppercase font-semibold">
                Access Fee
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-black text-green-600 dark:text-green-400">
                  ₹ FREE
                </span>
                {batch.fee?.total && batch.fee.total > 0 && (
                  <span className="text-xs text-muted-foreground line-through">
                    ₹{batch.fee.total}
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Curriculum outline & schedule publicly available.
              </p>
            </div>

            {/* Enrollment / Save Actions */}
            <div className="space-y-2">
              {isSaved ? (
                <button
                  onClick={toggleSave}
                  className="w-full py-2.5 rounded-lg border border-border bg-muted/60 text-foreground text-sm font-semibold transition-colors flex items-center justify-center gap-2 hover:bg-muted"
                >
                  <Check className="w-4 h-4 text-green-600" />
                  Enrolled in My Batches
                </button>
              ) : (
                <button
                  onClick={toggleSave}
                  className="w-full py-2.5 rounded-lg bg-green-500 hover:bg-green-600 text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2 shadow-sm"
                >
                  <BookmarkPlus className="w-4 h-4" />
                  Enroll in Batch
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Video Player Container (When active) */}
        {activeVideo && (
          <div ref={videoPlayerRef} className="space-y-3 scroll-mt-20">
            <VideoPlayer
              src={activeVideo.src}
              title={activeVideo.title}
              lectureId={activeVideo.lectureId}
              onClose={() => setActiveVideo(null)}
            />
          </div>
        )}

        {/* Today's Classes / Scheduled Live Lectures (PW Thor feature) */}
        <div className="border border-border rounded-xl p-5 bg-card space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <h3 className="font-bold text-base text-foreground flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" />
              <span>Today&apos;s Scheduled Classes</span>
            </h3>
            {todayClasses.length > 0 && (
              <span className="text-xs text-muted-foreground">
                {todayClasses.length} live / scheduled
              </span>
            )}
          </div>

          {isLoadingSchedule ? (
            <div className="py-6 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
              <span>Checking schedule...</span>
            </div>
          ) : todayClasses.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {todayClasses.map((cls: any) => {
                const startTime = cls.startTime ? new Date(cls.startTime).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "";
                return (
                  <div
                    key={cls._id || cls.topic}
                    onClick={() => handlePlayLecture(cls)}
                    className="p-4 rounded-xl border border-border bg-background hover:shadow-md cursor-pointer transition-all space-y-3 group"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1 min-w-0">
                        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-purple-500/10 text-purple-600 border border-purple-500/20">
                          {cls.urlType || "Live Class"}
                        </span>
                        <h4 className="font-semibold text-sm text-foreground truncate group-hover:text-primary transition-colors">
                          {cls.topic || "Scheduled Class"}
                        </h4>
                      </div>
                      <PlayCircle className="w-5 h-5 text-primary shrink-0 group-hover:scale-110 transition-transform" />
                    </div>

                    <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border/60">
                      <span>{startTime ? `Time: ${startTime}` : "Today"}</span>
                      <span className="text-primary font-medium group-hover:underline">Join Lecture &rarr;</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-muted/40 border border-border/60 rounded-xl p-5 text-center text-xs text-muted-foreground w-full">
              Classes not Scheduled yet
            </div>
          )}
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-border gap-6 pt-2">
          <button
            onClick={() => setActiveTab("subjects")}
            className={`pb-3 text-sm font-semibold transition-colors flex items-center gap-2 border-b-2 ${
              activeTab === "subjects"
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Layers className="w-4 h-4" />
            Subjects ({subjects.length})
          </button>

          <button
            onClick={() => setActiveTab("description")}
            className={`pb-3 text-sm font-semibold transition-colors flex items-center gap-2 border-b-2 ${
              activeTab === "description"
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <BookOpen className="w-4 h-4" />
            Course Highlights
          </button>

          <button
            onClick={() => setActiveTab("streaming")}
            className={`pb-3 text-sm font-semibold transition-colors flex items-center gap-2 border-b-2 ${
              activeTab === "streaming"
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <PlayCircle className="w-4 h-4" />
            Video Streaming & Architecture
          </button>
        </div>

        {/* Subjects Tab */}
        {activeTab === "subjects" && (
          <div className="space-y-6 pt-2">
            {/* Subjects Grid */}
            <div>
              <h2 className="text-xl font-bold text-foreground mb-4">Subjects</h2>
              {subjects.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {subjects.map((sub) => {
                    const imageUrl =
                      sub.imageId?.baseUrl && sub.imageId?.key
                        ? `${sub.imageId.baseUrl}${sub.imageId.key}`
                        : "/logo.png";

                    const teachers = sub.teacherIds || [];
                    const isSelected = selectedSubject?.subjectId === sub.subjectId;

                    return (
                      <div
                        key={sub._id}
                        onClick={() => handleInspectSubject(sub)}
                        className={`border rounded-xl p-4 bg-card hover:shadow-md transition-all flex flex-col justify-between space-y-3 cursor-pointer group ${
                          isSelected ? "border-primary ring-1 ring-primary" : "border-border hover:border-primary/50"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-12 h-12 rounded-lg bg-muted flex-shrink-0 relative overflow-hidden flex items-center justify-center border border-border">
                            <Image
                              src={imageUrl}
                              alt={sub.subject}
                              width={48}
                              height={48}
                              className="object-contain"
                              unoptimized
                            />
                          </div>

                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-sm text-foreground truncate group-hover:text-primary transition-colors">
                              {sub.subject}
                            </h4>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {sub.tagCount || sub.lectureCount || 0} Chapters
                            </p>
                          </div>
                        </div>

                        {/* Faculty info */}
                        {teachers.length > 0 && (
                          <div className="pt-2 border-t border-border/60">
                            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
                              Faculty
                            </span>
                            <div className="space-y-1">
                              {teachers.slice(0, 2).map((t) => (
                                <div key={t._id} className="flex items-center gap-2 text-xs">
                                  <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
                                    {t.imageId?.baseUrl && t.imageId?.key ? (
                                      <Image
                                        src={`${t.imageId.baseUrl}${t.imageId.key}`}
                                        alt={t.firstName || "Faculty"}
                                        width={20}
                                        height={20}
                                        className="object-cover"
                                        unoptimized
                                      />
                                    ) : (
                                      <User className="w-3 h-3 text-muted-foreground" />
                                    )}
                                  </div>
                                  <span className="text-foreground font-medium truncate">
                                    {t.firstName} {t.lastName}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="pt-1 text-right">
                          <span className="text-[11px] text-primary font-medium group-hover:underline">
                            View Subject Chapters &rarr;
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm py-4">No subjects listed for this batch.</p>
              )}
            </div>

            {/* Chapters Section (When a subject is selected) */}
            {selectedSubject && (
              <div className="border border-border rounded-xl p-5 sm:p-6 bg-card space-y-5 mt-6">
                <div className="flex items-center justify-between border-b pb-3">
                  <div>
                    <h3 className="font-bold text-lg text-foreground flex items-center gap-2">
                      <Layers className="w-5 h-5 text-primary" />
                      Chapters for {selectedSubject.subject}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {selectedSubject.tagCount || selectedSubject.lectureCount || 0} scheduled chapters & lectures
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedSubject(null);
                      setSelectedTopic(null);
                      setTopicContents([]);
                    }}
                    className="text-xs text-muted-foreground hover:text-foreground font-medium"
                  >
                    Close
                  </button>
                </div>

                {isLoadingTopics ? (
                  <div className="py-8 text-center space-y-2">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" />
                    <p className="text-xs text-muted-foreground">Loading chapter curriculum...</p>
                  </div>
                ) : subjectTopics.length > 0 ? (
                  <div className="space-y-6">
                    {/* Chapter Cards Grid (Original PW Layout) */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {/* All Contents Summary Card */}
                      <article
                        onClick={() => handleInspectTopic({ _id: "all", name: "All Contents" })}
                        className={`bg-background border rounded-xl p-4 hover:shadow-md cursor-pointer transition-all ${
                          selectedTopic?._id === "all" ? "border-primary ring-1 ring-primary" : "border-border hover:border-primary/50"
                        }`}
                      >
                        <div className="border-l-4 border-indigo-500 pl-3 rounded">
                          <h4 className="text-base font-semibold text-foreground mb-1">
                            All Contents
                          </h4>
                          <p className="text-xs text-muted-foreground">
                            {totalVideos} Videos <span className="mx-1">•</span> {totalExercises} Exercises <span className="mx-1">•</span> {totalNotes} Notes
                          </p>
                        </div>
                      </article>

                      {/* Individual Chapter Cards */}
                      {subjectTopics.map((top) => (
                        <article
                          key={top._id}
                          onClick={() => handleInspectTopic(top)}
                          className={`bg-background border rounded-xl p-4 hover:shadow-md cursor-pointer transition-all ${
                            selectedTopic?._id === top._id ? "border-primary ring-1 ring-primary" : "border-border hover:border-primary/50"
                          }`}
                        >
                          <div className="border-l-4 border-indigo-500 pl-3 rounded">
                            <h4 className="text-base font-semibold text-foreground mb-1 truncate">
                              {top.name}
                            </h4>
                            <p className="text-xs text-muted-foreground">
                              {top.videos || top.videosCount || 0} Videos{" "}
                              <span className="mx-1">•</span>{" "}
                              {top.exercises || top.dppsCount || 0} Exercises{" "}
                              <span className="mx-1">•</span>{" "}
                              {top.notes || top.notesCount || 0} Notes
                            </p>
                          </div>
                        </article>
                      ))}
                    </div>

                    {/* Selected Chapter Study Materials Section */}
                    {selectedTopic && (
                      <div className="border border-border/80 rounded-xl p-4 sm:p-5 bg-background space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3">
                          <h4 className="text-base font-bold text-foreground flex items-center gap-2 truncate">
                            <FileText className="w-4 h-4 text-primary shrink-0" />
                            <span>{selectedTopic.name}</span>
                          </h4>

                          {/* Content Navigation Tabs: Lectures, Notes, DPPs */}
                          <div className="flex items-center gap-1 bg-muted p-1 rounded-lg text-xs font-semibold">
                            <button
                              onClick={() => handleInspectTopic(selectedTopic, "videos")}
                              className={`px-3 py-1.5 rounded-md transition-colors ${
                                contentTab === "videos"
                                  ? "bg-background text-foreground shadow-sm"
                                  : "text-muted-foreground hover:text-foreground"
                              }`}
                            >
                              Lectures
                            </button>
                            <button
                              onClick={() => handleInspectTopic(selectedTopic, "notes")}
                              className={`px-3 py-1.5 rounded-md transition-colors ${
                                contentTab === "notes"
                                  ? "bg-background text-foreground shadow-sm"
                                  : "text-muted-foreground hover:text-foreground"
                              }`}
                            >
                              Notes
                            </button>
                            <button
                              onClick={() => handleInspectTopic(selectedTopic, "exercises")}
                              className={`px-3 py-1.5 rounded-md transition-colors ${
                                contentTab === "exercises"
                                  ? "bg-background text-foreground shadow-sm"
                                  : "text-muted-foreground hover:text-foreground"
                              }`}
                            >
                              DPP & Exercises
                            </button>
                          </div>
                        </div>

                        {/* Content Items List */}
                        {isLoadingContents ? (
                          <div className="py-8 text-center space-y-2">
                            <Loader2 className="w-5 h-5 animate-spin mx-auto text-primary" />
                            <p className="text-xs text-muted-foreground">Loading materials...</p>
                          </div>
                        ) : contentUnavailable ? (
                          <div className="py-6 text-center space-y-2.5 bg-muted/20 border border-dashed rounded-lg p-4">
                            <Lock className="w-5 h-5 mx-auto text-muted-foreground" />
                            <p className="text-xs font-semibold text-foreground">Content Restricted</p>
                            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                              Provider restricts full chapter lessons, notes, and exercises to verified student accounts.
                            </p>
                            {!isAuthenticated && (
                              <button
                                onClick={openLoginModal}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold shadow-sm transition-all mt-1"
                              >
                                <Smartphone className="w-3.5 h-3.5" />
                                <span>Sign In with Phone</span>
                              </button>
                            )}
                          </div>
                        ) : topicContents.length > 0 ? (
                          <div className="space-y-2.5">
                            {topicContents.map((item) => {
                              const extracted = extractLectureVideoSource(item);
                              const isVideoItem =
                                contentTab === "videos" ||
                                item.type === "DppVideos" ||
                                extracted.type === "youtube" ||
                                extracted.type === "hls" ||
                                extracted.type === "mp4";

                              const isCurrentlyPlaying = activeVideo?.lectureId === item._id;

                              return (
                                <div
                                  key={item._id}
                                  className={`p-3.5 rounded-lg border bg-card flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all ${
                                    isCurrentlyPlaying
                                      ? "border-purple-600 ring-2 ring-purple-600/30 bg-purple-500/5 shadow-md"
                                      : "border-border hover:border-primary/40"
                                  }`}
                                >
                                  <div className="space-y-1">
                                    <div className="font-semibold text-xs sm:text-sm text-foreground flex flex-wrap items-center gap-2">
                                      {isVideoItem ? (
                                        <Video className="w-4 h-4 text-purple-600 shrink-0" />
                                      ) : contentTab === "notes" || item.type === "DppNotes" ? (
                                        <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                                      ) : (
                                        <HelpCircle className="w-4 h-4 text-amber-600 shrink-0" />
                                      )}
                                      <span className="truncate">{item.name || item.topic || "Study Material"}</span>
                                      {isCurrentlyPlaying && (
                                        <span className="text-[10px] font-bold bg-purple-600 text-white px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0 animate-pulse">
                                          <Play className="w-2.5 h-2.5 fill-current" />
                                          Playing in Frame
                                        </span>
                                      )}
                                      {item.isFree && !isCurrentlyPlaying && (
                                        <span className="text-[10px] font-bold bg-green-500/10 text-green-600 px-1.5 py-0.5 rounded border border-green-500/20 shrink-0">
                                          Free
                                        </span>
                                      )}
                                      {Boolean(item.duration) && (
                                        <span className="text-[10px] font-medium text-muted-foreground bg-muted px-1.5 py-0.5 rounded shrink-0">
                                          {item.duration}
                                        </span>
                                      )}
                                      {Boolean(item.questionsCount && item.questionsCount > 0) && (
                                        <span className="text-[10px] font-bold bg-amber-500/10 text-amber-600 px-1.5 py-0.5 rounded border border-amber-500/20 shrink-0">
                                          {item.questionsCount} Questions
                                        </span>
                                      )}
                                    </div>
                                    {item.date && (
                                      <p className="text-[11px] text-muted-foreground">
                                        Published: {formatDate(item.date)}
                                      </p>
                                    )}
                                  </div>

                                  {isVideoItem ? (
                                    <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
                                      <button
                                        onClick={() => handlePlayLecture(item)}
                                        className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold shadow-sm transition-all ${
                                          isCurrentlyPlaying
                                            ? "bg-green-600 hover:bg-green-700 text-white ring-2 ring-green-600/40"
                                            : "bg-purple-600 hover:bg-purple-700 text-white"
                                        }`}
                                      >
                                        <Play className="w-3.5 h-3.5 fill-current" />
                                        <span>
                                          {isCurrentlyPlaying
                                            ? "Playing in Frame"
                                            : contentTab === "exercises"
                                            ? "Watch DPP Video"
                                            : "Watch in Frame"}
                                        </span>
                                      </button>

                                      <Link
                                        href={`/watch?batchId=${id}&SubjectId=${encodeURIComponent(selectedSubject.slug || selectedSubject._id || selectedSubject.subjectId || "")}&ChildId=${item._id}&Type=${item.urlType || extracted.type}&VideoUrl=${encodeURIComponent(extracted.rawUrl || item.url || "")}&title=${encodeURIComponent(item.name || item.topic || "Lecture")}`}
                                        className="p-1.5 rounded-lg border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                                        title="Open in dedicated watch page"
                                      >
                                        <ExternalLink className="w-4 h-4" />
                                      </Link>
                                    </div>
                                  ) : contentTab === "exercises" && !item.url?.includes(".pdf") ? (
                                    <a
                                      href={item.url || "#"}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-sm transition-all shrink-0 self-start sm:self-center"
                                    >
                                      <HelpCircle className="w-3.5 h-3.5" />
                                      <span>Start Exercise</span>
                                    </a>
                                  ) : (
                                    <a
                                      href={item.url || "#"}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-border hover:bg-muted text-foreground text-xs font-semibold transition-colors shrink-0 self-start sm:self-center"
                                    >
                                      <Download className="w-3.5 h-3.5" />
                                      <span>{contentTab === "exercises" ? "View DPP Sheet" : "Download Document"}</span>
                                    </a>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="py-4 text-center">
                            <p className="text-xs text-muted-foreground">
                              No {contentTab} published for this chapter.
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : topicsUnavailable ? (
                  <div className="py-4 text-center">
                    <p className="text-xs text-muted-foreground">Chapter content unavailable</p>
                  </div>
                ) : (
                  <div className="py-4 text-center">
                    <p className="text-xs text-muted-foreground">No chapters currently published for this subject.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Description Tab */}
        {activeTab === "description" && (
          <div className="prose dark:prose-invert max-w-none pt-2 text-sm text-foreground">
            {batch.description ? (
              <div
                dangerouslySetInnerHTML={{ __html: batch.description }}
                className="overflow-x-auto space-y-3"
              />
            ) : batch.shortDescription ? (
              <div
                dangerouslySetInnerHTML={{ __html: batch.shortDescription }}
                className="overflow-x-auto space-y-3"
              />
            ) : (
              <p className="text-muted-foreground py-4">
                No description published for this batch.
              </p>
            )}
          </div>
        )}

        {/* Video Streaming Architecture Tab */}
        {activeTab === "streaming" && (
          <div className="space-y-5 pt-2 text-sm text-foreground">
            <div className="border border-border rounded-xl p-5 bg-card space-y-4">
              <div className="flex items-center gap-2 text-base font-bold text-foreground">
                <PlayCircle className="w-5 h-5 text-primary" />
                <span>Video Streaming & Playback Architecture</span>
              </div>

              <p className="text-muted-foreground leading-relaxed">
                PhysicsWallah / PenPencil lectures are delivered across multiple streaming formats based on lecture type and entitlement:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                <div className="p-4 rounded-xl border border-border bg-background space-y-2">
                  <div className="flex items-center gap-2 font-bold text-sm text-red-600">
                    <Video className="w-4 h-4" />
                    <span>Public Lectures: YouTube</span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Orientation, demo lectures, and public syllabus classes stream directly via YouTube without authentication.
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-border bg-background space-y-2">
                  <div className="flex items-center gap-2 font-bold text-sm text-purple-600">
                    <Layers className="w-4 h-4" />
                    <span>HLS Manifest (.m3u8)</span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Dynamic master playlists supporting adaptive bitrate streaming (1080p, 720p, 480p, 360p, 240p) with low latency.
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-border bg-background space-y-2">
                  <div className="flex items-center gap-2 font-bold text-sm text-primary">
                    <Lock className="w-4 h-4" />
                    <span>Signed CDN Access</span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Encrypted course lectures streamed via AWS CloudFront with HMAC tokens and AES-128 key verification.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
