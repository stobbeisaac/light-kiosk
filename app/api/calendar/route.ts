import { NextResponse } from "next/server";

export async function GET() {
  const icsUrl = process.env.NEXT_PUBLIC_CALENDAR_ICS_URL;

  if (!icsUrl) {
    return NextResponse.json(
      { error: "Calendar URL not configured" },
      { status: 500 }
    );
  }

  try {
    const response = await fetch(icsUrl, {
      headers: {
        "User-Agent": "Light-Kiosk/1.0",
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to fetch calendar" },
        { status: response.status }
      );
    }

    const text = await response.text();

    return new NextResponse(text, {
      status: 200,
      headers: {
        "Content-Type": "text/calendar",
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}
