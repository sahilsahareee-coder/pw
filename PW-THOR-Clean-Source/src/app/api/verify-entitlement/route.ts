import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const batchId = body?.batchId;

    if (!batchId) {
      return NextResponse.json(
        { success: false, message: "Missing required parameter: batchId" },
        { status: 400 }
      );
    }

    // Extract student session token from Authorization header, cookie, or request body
    const authHeader = request.headers.get("authorization");
    let token = authHeader?.replace(/^Bearer\s+/i, "").trim();

    if (!token) {
      token = request.cookies.get("auth_token")?.value;
    }
    if (!token && body?.token) {
      token = body.token.trim();
    }

    // Step 1: Query the official PenPencil API to inspect batch details
    const penpencilUrl = `https://api.penpencil.co/v3/batches/${batchId}/details`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    const headers: Record<string, string> = {
      accept: "application/json",
      "client-id": "5eb393ee95fab7468a79d189",
      "client-type": "WEB",
      "client-version": "2.2.7",
      origin: "https://www.pw.live",
      referer: "https://www.pw.live/",
      randomid: "4bb61dbd-bc60-4a20-a1aa-44e7c0c8e0ec",
      "user-agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36",
    };

    if (token) {
      headers["authorization"] = token.startsWith("Bearer ") ? token : `Bearer ${token}`;
    }

    let upstreamData: any = null;

    try {
      const res = await fetch(penpencilUrl, {
        method: "GET",
        headers,
        signal: controller.signal,
        cache: "no-store",
      });
      clearTimeout(timeout);

      if (res.ok) {
        const json = await res.json();
        upstreamData = json?.data;
      }
    } catch (fetchErr) {
      clearTimeout(timeout);
      console.warn("Could not query upstream details during entitlement check:", fetchErr);
    }

    // Step 2: Check if upstream reports isPurchased: true directly
    let isPurchased = Boolean(upstreamData?.isPurchased);
    const feeTotal = upstreamData?.fee?.total ?? upstreamData?.batchPrice ?? 0;

    // Step 3: If token is provided and isPurchased is false, also check my-batches
    if (!isPurchased && token) {
      try {
        const myBatchesRes = await fetch("https://api.penpencil.co/v3/batches/my-batches", {
          method: "GET",
          headers,
          cache: "no-store",
        });
        if (myBatchesRes.ok) {
          const myBatchesJson = await myBatchesRes.json();
          const list: any[] = myBatchesJson?.data || [];
          const found = list.some(
            (b) => b._id === batchId || b.batchId === batchId || b.slug === upstreamData?.slug
          );
          if (found) {
            isPurchased = true;
          }
        }
      } catch (myErr) {
        console.warn("Could not query user my-batches during entitlement check:", myErr);
      }
    }

    // Step 4: If upstream officially confirms purchase, grant confirmed entitlement
    if (isPurchased) {
      return NextResponse.json({
        success: true,
        entitlementStatus: "CONFIRMED",
        isEnrolled: true,
        isPurchased: true,
        requiresPurchase: false,
        message: "Enrollment confirmed. Verified course access is active.",
      });
    }

    // Step 5: If user has no valid session token, indicate authentication is required
    if (!token) {
      return NextResponse.json({
        success: true,
        entitlementStatus: "AUTHENTICATION_REQUIRED",
        isEnrolled: false,
        isPurchased: false,
        requiresPurchase: true,
        feeTotal,
        message:
          "Authentication Required: You are currently browsing as a guest. Please sign in with your authorized student account to verify course enrollment and unlock chapter contents.",
      });
    }

    // Step 6: User is authenticated, but does not own this batch
    return NextResponse.json({
      success: true,
      entitlementStatus: "ACCESS_RESTRICTED",
      isEnrolled: false,
      isPurchased: false,
      requiresPurchase: true,
      feeTotal,
      message:
        "Access Restricted: Your student account is authenticated, but this specific batch requires an active purchase/subscription on the educational platform (api.penpencil.co). Chapters remain locked.",
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        entitlementStatus: "ERROR",
        message: error.message || "Failed to verify entitlement.",
      },
      { status: 500 }
    );
  }
}
