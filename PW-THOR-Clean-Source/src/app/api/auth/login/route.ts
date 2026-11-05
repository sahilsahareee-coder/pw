import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const token = body?.token?.trim();
    const rawPhone = (body?.phoneNumber || body?.phone || body?.mobile || body?.username || "").toString().trim();
    const password = body?.password?.toString().trim();
    const otp = body?.otp?.toString().trim();
    const smsType = (body?.smsType || "1").toString();
    const fallback = body?.fallback || "false";

    const cleanPhone = rawPhone.replace(/\D/g, "").slice(-10);

    // If caller wants to send OTP (like StudyPanda's /api/auth/login)
    if (cleanPhone && !password && !otp && !token) {
      if (cleanPhone.length !== 10) {
        return NextResponse.json(
          { success: false, message: "Please enter a valid 10-digit mobile number." },
          { status: 400 }
        );
      }

      try {
        const spRes = await fetch("https://physicswalla.studypanda.live/api/auth/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36",
          },
          body: JSON.stringify({
            phoneNumber: cleanPhone,
            smsType: smsType,
            fallback: fallback,
          }),
          cache: "no-store",
        });

        const spData = await spRes.json().catch(() => null);
        if (spRes.ok && spData?.success) {
          return NextResponse.json({
            success: true,
            message:
              spData.message ||
              `OTP sent successfully via ${smsType === "1" ? "WhatsApp" : "SMS"}!`,
            data: spData.data,
          });
        }
        if (spData?.message) {
          return NextResponse.json(
            { success: false, message: spData.message },
            { status: spRes.status || 400 }
          );
        }
      } catch (e) {
        // Continue
      }

      return NextResponse.json(
        { success: false, message: "Failed to send OTP. Please try WhatsApp mode." },
        { status: 500 }
      );
    }

    if (!token && !cleanPhone) {
      return NextResponse.json(
        { success: false, message: "Please provide your mobile number or an authorization token." },
        { status: 400 }
      );
    }

    let finalToken = token;
    let initialUser: any = null;

    // 1. Phone number authentication with OTP
    if (cleanPhone && otp) {
      // Forward to verify-otp logic
      try {
        const spRes = await fetch("https://physicswalla.studypanda.live/api/auth/verify-otp", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36",
          },
          body: JSON.stringify({ phoneNumber: cleanPhone, otp: otp }),
          cache: "no-store",
        });
        const spData = await spRes.json().catch(() => null);
        if (spRes.ok && spData?.success) {
          initialUser = spData.user || spData.data?.user;
          finalToken = spData.token || spData.data?.token || spData.data?.access_token;
        }
      } catch (spErr) {
        // fallback to PenPencil OAuth
      }

      if (!finalToken) {
        try {
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
            body: JSON.stringify({
              username: cleanPhone,
              grant_type: "otp",
              otp: otp,
              client_id: "5eb393ee95fab7468a79d189",
              organizationId: "5eb393ee95fab7468a79d189",
            }),
            cache: "no-store",
          });
          const oauthData = await oauthRes.json().catch(() => null);
          if (oauthRes.ok && oauthData?.data?.access_token) {
            finalToken = oauthData.data.access_token;
            initialUser = oauthData.data.user;
          }
        } catch (oauthErr) {
          // Continue
        }
      }

      if (!finalToken) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Username or OTP is incorrect. Please enter the latest OTP received or request a fresh OTP via WhatsApp.",
          },
          { status: 412 }
        );
      }
    }

    // 2. Phone number authentication with Password
    if (cleanPhone && password && !finalToken) {
      const oauthPayload: Record<string, any> = {
        username: cleanPhone,
        grant_type: "password",
        password: password,
        client_id: "5eb393ee95fab7468a79d189",
        organizationId: "5eb393ee95fab7468a79d189",
      };

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 12000);

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
          "user-agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36",
        },
        body: JSON.stringify(oauthPayload),
        signal: controller.signal,
        cache: "no-store",
      });
      clearTimeout(timeout);

      const oauthData = await oauthRes.json().catch(() => null);

      if (!oauthRes.ok || !oauthData?.data?.access_token) {
        const errorMsg =
          oauthData?.message ||
          oauthData?.error?.message ||
          "Incorrect mobile number or password.";
        return NextResponse.json(
          { success: false, message: errorMsg },
          { status: oauthRes.status || 401 }
        );
      }

      finalToken = oauthData.data.access_token;
      initialUser = oauthData.data.user;
    }

    if (!finalToken) {
      return NextResponse.json(
        { success: false, message: "Please enter your password, OTP, or session token to sign in." },
        { status: 400 }
      );
    }

    // 3. Confirm student profile using token
    let userData = initialUser || {};
    try {
      const userRes = await fetch("https://api.penpencil.co/v1/users/self", {
        method: "GET",
        headers: {
          accept: "application/json",
          "client-id": "5eb393ee95fab7468a79d189",
          "client-type": "WEB",
          "client-version": "2.2.7",
          origin: "https://www.pw.live",
          referer: "https://www.pw.live/",
          randomid: "4bb61dbd-bc60-4a20-a1aa-44e7c0c8e0ec",
          authorization: finalToken.startsWith("Bearer ") ? finalToken : `Bearer ${finalToken}`,
        },
        cache: "no-store",
      });

      if (userRes.ok) {
        const json = await userRes.json();
        userData = json?.data || userData;
      }
    } catch (selfErr) {
      // Continue
    }

    const fullName =
      userData.name ||
      [userData.firstName, userData.lastName].filter(Boolean).join(" ") ||
      (cleanPhone ? `Student (${cleanPhone.slice(-4)})` : "Verified Student");

    const response = NextResponse.json({
      success: true,
      user: {
        _id: userData._id || userData.id || "",
        name: fullName,
        firstName: userData.firstName || "",
        lastName: userData.lastName || "",
        mobile: userData.mobile || cleanPhone || "",
        email: userData.email || "",
      },
      token: finalToken,
      message: `Successfully signed in as ${fullName}.`,
    });

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

    return response;
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to authenticate session." },
      { status: 500 }
    );
  }
}
