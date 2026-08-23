import { NextResponse } from "next/server";

export async function GET(request: Request) {
  // Sicherheitscheck (optional, via Vercel Cron Secret)
  
  try {
    // 1. Wetter für München (OEZ) abrufen
    const res = await fetch("https://api.open-meteo.com/v1/forecast?latitude=48.1764&longitude=11.5311&daily=temperature_2m_min,temperature_2m_max,precipitation_sum&timezone=Europe%2FBerlin");
    const data = await res.json();
    
    const minTemp = data.daily.temperature_2m_min[0];
    const precip = data.daily.precipitation_sum[0];

    let alertMsg = "";
    let tags = "";

    // 2. Proaktive Regeln definieren
    if (minTemp <= 3) {
      alertMsg = `Achtung: Frostgefahr (${minTemp}°C). Balkonpflanzen hereinholen! 🪴❄️`;
      tags = "snowflake,warning";
    } else if (precip > 5) {
      alertMsg = `Heute gibt es ordentlich Regen (${precip}mm). Fenster zu und Schirm einpacken! ☔️`;
      tags = "umbrella,droplet";
    }

    // 3. Wenn eine Regel zutrifft, ntfy Push senden
    if (alertMsg) {
      await fetch("https://ntfy.sh/HaushaltLenaJonas", {
        method: "POST",
        body: alertMsg,
        headers: { 
          "Title": "Haushalt OS - Wetter Alarm", 
          "Tags": tags, 
          "Priority": "high" 
        }
      });
    }

    return NextResponse.json({ success: true, message: alertMsg || "Kein Alarm nötig." });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Wetter-Check fehlgeschlagen" }, { status: 500 });
  }
}