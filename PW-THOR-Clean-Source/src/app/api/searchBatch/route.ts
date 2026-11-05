import { NextRequest, NextResponse } from "next/server";
import fallbackData from "@/data/batches.json";
import { BatchItem } from "@/types";

export const revalidate = 60;

function normalizeBatch(b: any): BatchItem {
  const id = b?._id || b?.batchId || "";
  const name = b?.name || b?.batchName || "PW Earners Batch";
  const image =
    b?.batchImage ||
    "https://static.pw.live/5eb393ee95fab7468a79d189/ADMIN/4f17deae-eab1-4b19-b5cb-2bb2291d60e5.jpg";

  return {
    _id: id,
    batchId: id,
    batchName: name,
    batchImage: image,
    language: b?.language || "Hinglish",
    template: b?.template || "NORMAL",
    startDate: b?.startDate || "2024-06-01",
    endDate: b?.endDate || "2025-12-31",
    batchPrice: b?.batchPrice || 0,
    byName: b?.byName || "PW Earners Upskilling",
    isExternal: Boolean(b?.isExternal),
  };
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = (searchParams.get("name") || searchParams.get("query") || "").toLowerCase().trim();
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "12", 10);

  const safePage = isNaN(page) || page < 1 ? 1 : page;
  const safeLimit = isNaN(limit) || limit < 1 ? 12 : limit;

  const allBatches: BatchItem[] = (fallbackData.data as any[]).map(normalizeBatch);

  const filtered = query
    ? allBatches.filter(
        (b) =>
          b.batchName.toLowerCase().includes(query) ||
          (b.byName && b.byName.toLowerCase().includes(query))
      )
    : allBatches;

  const startIndex = (safePage - 1) * safeLimit;
  const paginated = filtered.slice(startIndex, startIndex + safeLimit);
  const totalPages = Math.ceil(filtered.length / safeLimit) || 1;
  const hasMore = safePage < totalPages;

  return NextResponse.json({
    success: true,
    data: paginated,
    currentPage: safePage,
    totalPages,
    totalItems: filtered.length,
    hasMore,
  });
}
