import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    // 1. Sichere den Cron-Job ab, damit nur Vercel ihn aufrufen darf
    const authHeader = request.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return new Response('Unauthorized', { status: 401 });
    }

    // 2. Daten sammeln (Beispiel: Wetter abrufen)
    const weatherRes = await fetch("https://api.open-meteo.com/v1/forecast?latitude=48.1764&longitude=11.5311&current=temperature_2m");
    const weatherData = await weatherRes.json();
    const temp = weatherData?.current?.temperature_2m ?? "--";

    // Hier könntest du auch deine Google Sheets API abrufen für offene To-Dos!
    const nachricht = `Guten Morgen! Es hat aktuell ${temp}°C am OEZ. Vergiss nicht, in dein Dashboard zu schauen!`;

    // 3. Push-Nachricht über ntfy senden
    // WICHTIG: Ersetze "haushalt_os_jonas_geheim" durch dein eigenes, sicheres ntfy-Topic
    await fetch("https://ntfy.sh/haushalt_os_jonas_geheim", {
      method: "POST",
      body: nachricht,
      headers: {
        "Title": "🏠 Haushalt OS Briefing",
        "Tags": "coffee,sun_with_face",
        "Priority": "default"
      }
    });

    return NextResponse.json({ success: true, message: "ntfy Push gesendet!" });
  } catch (error) {
    console.error("Cron Error:", error);
    return NextResponse.json({ error: "Fehler beim Cron Job" }, { status: 500 });
  }
}