import { NextResponse } from "next/server";
import ICAL from "ical.js";

export async function GET() {
  try {
    // Trage hier deinen echten ICS-Link ein (z.B. aus der iCloud / Apple Kalender)
    const ICS_URL = process.env.APPLE_CALENDAR_URL || "webcal://p45-caldav.icloud.com/published/2/MTYzNjM0MTI0MjExNjM2M1r9_RM37mGdFBnt5dTR2VkxAwiyAF-9Uk1Sh6tTfNZ5UvQ5ZYrWzNZpZF7QaMpPOjUGvn6Rz_HzucNxcdNS078";

    if (!ICS_URL || ICS_URL === "DEIN_ICS_LINK_HIER") {
      return NextResponse.json({ events: [{ title: "Kein Kalender-Link hinterlegt", date: "Bitte prüfen" }] });
    }

    const response = await fetch(ICS_URL);
    const text = await response.text();

    const jcalData = ICAL.parse(text);
    const comp = new ICAL.Component(jcalData);
    const vevents = comp.getAllSubcomponents("vevent");

    const now = new Date();
    const events = vevents.map(vevent => {
      const event = new ICAL.Event(vevent);
      return {
        title: event.summary,
        startDate: event.startDate.toJSDate(),
        dateStr: event.startDate.toJSDate().toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })
      };
    })
    .filter(e => e.startDate >= now) // Nur zukünftige Termine
    .sort((a, b) => a.startDate.getTime() - b.startDate.getTime())
    .slice(0, 5) // Die nächsten 5 Termine
    .map(e => ({
      title: e.title,
      date: e.dateStr
    }));

    return NextResponse.json({ events });
  } catch (error) {
    console.error("Calendar Error:", error);
    return NextResponse.json({ error: "Fehler beim Laden des Kalenders" }, { status: 500 });
  }
}