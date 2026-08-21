import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Hier wird dein Apple Kalender / ICS Link abgefragt
    // (In deiner alten App war das die URL deines iCloud-Kalenders)
    const icuUrl = "webcal://p45-caldav.icloud.com/published/2/MTYzNjM0MTI0MjExNjM2M1r9_RM37mGdFBnt5dTR2VkxAwiyAF-9Uk1Sh6tTfNZ5UvQ5ZYrWzNZpZF7QaMpPOjUGvn6Rz_HzucNxcdNS078"; 
    
    // Fallbzw. Dummy-Daten, falls der Link noch nicht hinterlegt ist
    const events = [
      { title: "Sport / Einkaufen", date: "Heute, 18:00 Uhr" }
    ];

    return NextResponse.json({ events });
  } catch (error) {
    return NextResponse.json({ error: "Fehler beim Laden des Kalenders" }, { status: 500 });
  }
}