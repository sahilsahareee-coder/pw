import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const rawPhone = (body?.phoneNumber || body?.phone || body?.mobile || "").toString().trim();
    const rawOtp = (body?.otp || "").toString().trim();

    const cleanPhone = rawPhone.replace(/\D/g, "").slice(-10);
    if (!cleanPhone || cleanPhone.length !== 10) {
      return NextResponse.json(
        { success: false, message: "Please enter a valid 10-digit mobile number." },
        { status: 400 }
      );
    }

    const cleanOtp = rawOtp.replace(/\D/g, "").slice(0, 6);
    if (!cleanOtp || cleanOtp.length < 4) {
      return NextResponse.json(
        { success: false, message: "Please enter the verification code (OTP)." },
        { status: 400 }
      );
    }

    let finalToken: string | null = null;
    let userData: any = null;
    let cookieHeaders: string[] = [];

    // 1. First, attempt verification via StudyPanda's user auth microservice
    try {
      const spRes = await fetch("https://physicswalla.studypanda.live/api/auth/verify-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36",
        },
        body: JSON.stringify({
          phoneNumber: cleanPhone,
          otp: cleanOtp,
        }),
        cache: "no-store",
      });

      const spData = await spRes.json().catch(() => null);

      if (spRes.ok && spData?.success) {
        userData = spData.user || spData.data?.user || null;
        finalToken = spData.token || spData.data?.token || spData.data?.access_token || null;

        // Capture cookies returned by StudyPanda
        const setCookieHeaders = spRes.headers.get("set-cookie");
        if (setCookieHeaders) {
          cookieHeaders.push(setCookieHeaders);
        }
      } else if (spData?.message && spData.message.includes("Username or OTP is incorrect")) {
        // If StudyPanda explicitly says incorrect OTP, don't silently fail; try PenPencil OAuth below
      }
    } catch (spErr) {
      console.warn("StudyPanda verify-otp request failed, trying PenPencil OAuth...", spErr);
    }

    // 2. Direct PenPencil OAuth OTP verification fallback
    if (!finalToken) {
      try {
        const oauthPayload = {
          username: cleanPhone,
          grant_type: "otp",
          otp: cleanOtp,
          client_id: "5eb393ee95fab7468a79d189",
          organizationId: "5eb393ee95fab7468a79d189",
        };

        const oauthRes = await fetch("https://api.penpencil.co/v3/oauth/token", {
          method: "POST",
          headers: {
            accept: "application/json",
            "content-type": "application/json",
            "client-id": "5eb393ee95fab7468a79d189",
            "client-type": "WEB",
            "client-version": "2.2.7",
            origin: "https://www.pw.live",
            referer: "https://www.pw.live/",
            randomid: "4bb61dbd-bc60-4a20-a1aa-44e7c0c8e0ec",
          },
          body: JSON.stringify(oauthPayload),
          cache: "no-store",
        });

        const oauthData = await oauthRes.json().catch(() => null);

        if (oauthRes.ok && oauthData?.data?.access_token) {
          finalToken = oauthData.data.access_token;
          userData = oauthData.data.user || userData;
        }
      } catch (ppErr) {
        console.warn("PenPencil OAuth OTP attempt failed:", ppErr);
      }
    }

    if (!finalToken && !userData) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Username or OTP is incorrect. Please enter the latest OTP received or request a fresh OTP via WhatsApp.",
        },
        { status: 412 }
      );
    }

    // 3. If we have a token, fetch full student profile from /v1/users/self
    if (finalToken && (!userData || !userData.name)) {
      try {
        const userRes = await fetch("https://api.penpencil.co/v1/users/self", {
          headers: {
            accept: "application/json",
            "client-id": "5eb393ee95fab7468a79d189",
            "client-type": "WEB",
            "client-version": "2.2.7",
            origin: "https://www.pw.live",
            referer: "https://www.pw.live/",
            authorization: finalToken.startsWith("Bearer ") ? finalToken : `Bearer ${finalToken}`,
          },
          cache: "no-store",
        });
        if (userRes.ok) {
          const uJson = await userRes.json();
          if (uJson?.data) {
            userData = { ...userData, ...uJson.data };
          }
        }
      } catch (selfErr) {
        // Continue with available data
      }
    }

    const fullName =
      userData?.name ||
      [userData?.firstName, userData?.lastName].filter(Boolean).join(" ") ||
      `Student (${cleanPhone.slice(-4)})`;

    const userObj = {
      _id: userData?._id || userData?.id || "",
      name: fullName,
      firstName: userData?.firstName || "",
      lastName: userData?.lastName || "",
      mobile: userData?.mobile || cleanPhone,
      email: userData?.email || "",
    };

    const response = NextResponse.json({
      success: true,
      message: "OTP Verified Successfully!",
      user: userObj,
      token: finalToken || "",
    });

    // Set authentication cookies
    if (finalToken) {
      response.cookies.set("auth_token", finalToken, {
        path: "/",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 30, // 30 days
        secure: process.env.NODE_ENV === "production",
      });
      response.cookies.set("token", finalToken, {
        path: "/",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 30,
        secure: process.env.NODE_ENV === "production",
      });
    }

    return response;
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
