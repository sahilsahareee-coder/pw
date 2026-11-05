/**
 * Video Source Extraction & Formatting Utility
 * Handles YouTube URLs, embeds, PenPencil HLS streams (.m3u8), DASH (.mpd), and direct video files.
 */

export interface ExtractedVideoSource {
  type: "youtube" | "hls" | "mp4" | "iframe" | "unknown";
  url: string;
  rawUrl: string;
  youtubeId?: string;
  embedUrl?: string;
  signedUrlQuery?: string;
}

/**
 * Extracts a YouTube Video ID from any URL, embed code, or iframe string
 */
export function extractYouTubeId(input: string): string | null {
  if (!input || typeof input !== "string") return null;

  const trimmed = input.trim();

  // If already an 11-char ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  // Check iframe src attribute: <iframe ... src="...youtube.com/embed/XYZ..."
  const iframeMatch = trimmed.match(/src=["']([^"']+)["']/i);
  const targetUrl = iframeMatch ? iframeMatch[1] : trimmed;

  // Standard YouTube patterns:
  // - youtube.com/watch?v=XYZ
  // - youtube.com/embed/XYZ
  // - youtu.be/XYZ
  // - youtube.com/live/XYZ
  // - youtube.com/v/XYZ
  const ytRegex =
    /(?:youtube(?:-nocookie)?\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?|watch|live)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/i;
  const match = targetUrl.match(ytRegex);

  return match ? match[1] : null;
}

/**
 * Extracts clean video playback source from any lecture item, raw URL, or embed string
 */
export function extractLectureVideoSource(input: any): ExtractedVideoSource {
  if (!input) {
    return { type: "unknown", url: "", rawUrl: "" };
  }

  // Extract raw source from object or string
  let raw = "";
  if (typeof input === "string") {
    raw = input.trim();
  } else if (typeof input === "object") {
    raw =
      input.videoDetails?.videoUrl ||
      input.videoUrl ||
      input.url ||
      input.streamUrl ||
      input.videoDetails?.embedCode ||
      input.embedCode ||
      input.videoDetails?.videoId ||
      input.videoId ||
      "";
  }

  raw = (raw || "").trim();

  // Extract query parameters if present (for CloudFront signature preservation)
  let signedUrlQuery = "";
  try {
    if (raw.includes("?")) {
      const idx = raw.indexOf("?");
      signedUrlQuery = raw.substring(idx);
    }
  } catch {
    // ignore
  }

  // Convert MPEG-DASH (.mpd) to HLS (.m3u8) for PenPencil streams
  if (raw.includes(".mpd")) {
    raw = raw.replace(/\.mpd(\?.*)?$/i, ".m3u8$1");
    if (!raw.includes(".m3u8")) {
      raw = raw.replace(/\.mpd/gi, ".m3u8");
    }
  }

  // 1. Check for YouTube
  const youtubeId = extractYouTubeId(raw);
  if (youtubeId) {
    const embedUrl = `https://www.youtube-nocookie.com/embed/${youtubeId}?autoplay=1&rel=0&modestbranding=1&playsinline=1`;
    return {
      type: "youtube",
      url: embedUrl,
      rawUrl: raw,
      youtubeId,
      embedUrl,
    };
  }

  // If urlType explicitly mentions youtube
  if (
    input?.urlType === "youtube" ||
    input?.type === "youtube" ||
    input?.Type === "youtube" ||
    input?.urlType === "brightcove"
  ) {
    const fallbackId = extractYouTubeId(
      input.url || input.VideoUrl || input.videoDetails?.videoUrl || ""
    );
    if (fallbackId) {
      const embedUrl = `https://www.youtube-nocookie.com/embed/${fallbackId}?autoplay=1&rel=0&modestbranding=1&playsinline=1`;
      return {
        type: "youtube",
        url: embedUrl,
        rawUrl: raw,
        youtubeId: fallbackId,
        embedUrl,
      };
    }
  }

  // 2. Check for iframe tag
  if (raw.includes("<iframe")) {
    const srcMatch = raw.match(/src=["']([^"']+)["']/i);
    if (srcMatch && srcMatch[1]) {
      const srcUrl = srcMatch[1];
      const ytId = extractYouTubeId(srcUrl);
      if (ytId) {
        return {
          type: "youtube",
          url: `https://www.youtube.com/embed/${ytId}?autoplay=1&enablejsapi=1&rel=0&modestbranding=1&playsinline=1`,
          rawUrl: raw,
          youtubeId: ytId,
        };
      }
      return {
        type: "iframe",
        url: srcUrl,
        rawUrl: raw,
      };
    }
  }

  // 3. Check for HLS stream (.m3u8)
  if (raw.includes(".m3u8") || raw.includes("master.m3u8")) {
    return {
      type: "hls",
      url: raw,
      rawUrl: raw,
      signedUrlQuery,
    };
  }

  // 4. Check for direct MP4 / WebM
  if (
    raw.endsWith(".mp4") ||
    raw.includes(".mp4?") ||
    raw.endsWith(".webm") ||
    raw.includes(".webm?")
  ) {
    return {
      type: "mp4",
      url: raw,
      rawUrl: raw,
      signedUrlQuery,
    };
  }

  // 5. Standard HTTP URL fallback (could be an embed or custom player stream)
  if (raw.startsWith("http://") || raw.startsWith("https://")) {
    return {
      type: "hls", // default to streaming player for CDN links
      url: raw,
      rawUrl: raw,
      signedUrlQuery,
    };
  }

  return {
    type: "unknown",
    url: raw,
    rawUrl: raw,
    signedUrlQuery,
  };
}
