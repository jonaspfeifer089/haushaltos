import { NextResponse } from "next/server";
import ICAL from "ical.js";

export async function GET() {
  try {
    const ICS_URL = process.env.APPLE_CALENDAR_URL;
    if (!ICS_URL) return NextResponse.json({ events: [] });

    const response = await fetch(ICS_URL);
    const text = await response.text();
    const jcalData = ICAL.parse(text);
    const comp = new ICAL.Component(jcalData);
    const vevents = comp.getAllSubcomponents("vevent");

    const now = new Date();
    const events = vevents
      .map((vevent) => {
        const event = new ICAL.Event(vevent);
        return {
          title: event.summary,
          startDate: event.startDate.toJSDate(),
          dateStr: event.startDate.toJSDate().toLocaleDateString("de-DE", {
            day: "2-digit",
            month: "2-digit",
            hour: "2-digit",
            minute: "2-digit"
          })
        };
      })
      .filter((e) => e.startDate >= now)
      .sort((a, b) => a.startDate.getTime() - b.startDate.getTime())
      .slice(0, 5)
      .map((e) => ({ title: e.title, date: e.dateStr }));

    return NextResponse.json({ events });
  } catch (error) {
    return NextResponse.json({ error: "Kalender Fehler" }, { status: 500 });
  }
}
