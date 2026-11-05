import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const rawPhone = (body?.phoneNumber || body?.phone || body?.mobile || "").toString().trim();
    const smsType = (body?.smsType || "1").toString(); // "1" = WhatsApp (preferred/reliable), "2" = SMS
    const fallback = body?.fallback || "false";

    const cleanPhone = rawPhone.replace(/\D/g, "").slice(-10);
    if (!cleanPhone || cleanPhone.length !== 10 || !/^[6-9][0-9]{9}$/.test(cleanPhone)) {
      return NextResponse.json(
        { success: false, message: "Please enter a valid 10-digit Indian mobile number." },
        { status: 400 }
      );
    }

    // Call upstream User Microservice via StudyPanda's verified OTP gateway
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

      // If StudyPanda returned a specific message, surface it
      if (spData?.message) {
        return NextResponse.json(
          { success: false, message: spData.message },
          { status: spRes.status || 400 }
        );
      }
    } catch (spErr) {
      console.warn("StudyPanda OTP gateway attempt failed, trying PenPencil fallback...", spErr);
    }

    // Fallback: Try direct PenPencil OTP endpoint
    try {
      const ppRes = await fetch("https://api.penpencil.co/v1/users/get-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "client-id": "5eb393ee95fab7468a79d189",
          "client-type": "WEB",
          "client-version": "2.2.7",
          origin: "https://www.pw.live",
          referer: "https://www.pw.live/",
          randomid: "4bb61dbd-bc60-4a20-a1aa-44e7c0c8e0ec",
        },
        body: JSON.stringify({
          username: cleanPhone,
          organizationId: "5eb393ee95fab7468a79d189",
          smsType: smsType,
        }),
        cache: "no-store",
      });

      const ppData = await ppRes.json().catch(() => null);
      if (ppRes.ok && ppData?.success) {
        return NextResponse.json({
          success: true,
          message: `OTP sent successfully via ${smsType === "1" ? "WhatsApp" : "SMS"}!`,
          data: ppData.data,
        });
      }
    } catch (ppErr) {
      // Ignore
    }

    return NextResponse.json(
      {
        success: false,
        message: "Failed to send OTP. Please check your mobile number or try WhatsApp mode.",
      },
      { status: 500 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
