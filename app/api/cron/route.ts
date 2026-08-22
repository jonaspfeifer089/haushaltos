import { NextResponse } from "next/server";
import { google } from "googleapis";
import ICAL from "ical.js";

const getAuth = () => new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  },
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

const spreadsheetId = "1Dj3_N9ybEhIDX5HukIELYtE2E3LToq4DiuPV3EBjOiA";

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return new Response('Unauthorized', { status: 401 });
    }

    // 1. Wetter abrufen (München OEZ / Standort)
    let temp = "--";
    try {
      const weatherRes = await fetch("https://api.open-meteo.com/v1/forecast?latitude=48.1764&longitude=11.5311&current=temperature_2m,weather_code");
      const weatherData = await weatherRes.json();
      temp = `${weatherData?.current?.temperature_2m ?? "--"}°C`;
    } catch (e) { console.error("Wetter Cron Error:", e); }

    // 2. Google Sheets Daten abrufen
    let offeneEinkaeufeCount = 0;
    let faelligePutzaufgaben: string[] = [];

    try {
      const sheets = google.sheets({ version: "v4", auth: getAuth() });
      const [einkaufRes, haushaltRes] = await Promise.all([
        sheets.spreadsheets.values.get({ spreadsheetId, range: "Einkauf!A:B" }),
        sheets.spreadsheets.values.get({ spreadsheetId, range: "Haushalt!A:D" })
      ]);

      const einkaufRows = einkaufRes.data.values?.slice(1) || [];
      offeneEinkaeufeCount = einkaufRows.filter(r => r[0] && r[1] !== "Erledigt").length;

      const haushaltRows = haushaltRes.data.values?.slice(1) || [];
      const today = new Date();
      
      haushaltRows.forEach(row => {
        const aufgabe = row[0];
        const letztesDatumStr = row[1];
        const intervallTage = parseInt(row[2] || "7", 10);
        
        if (aufgabe && letztesDatumStr) {
          const letztesDatum = new Date(letztesDatumStr);
          const diffTage = Math.floor((today.getTime() - letztesDatum.getTime()) / (1000 * 60 * 60 * 24));
          if (diffTage >= intervallTage) {
            faelligePutzaufgaben.push(aufgabe);
          }
        }
      });
    } catch (e) { console.error("Sheets Cron Error:", e); }

    // 3. Kalender-Termine für heute abrufen
    let heuteTermineCount = 0;
    try {
      const ICS_URL = process.env.APPLE_CALENDAR_URL;
      if (ICS_URL) {
        const calRes = await fetch(ICS_URL);
        const text = await calRes.text();
        const jcal = ICAL.parse(text);
        const comp = new ICAL.Component(jcal);
        const vevents = comp.getAllSubcomponents("vevent");
        const todayStr = new Date().toISOString().split("T")[0];

        heuteTermineCount = vevents.filter(vevent => {
          const ev = new ICAL.Event(vevent);
          const evDate = ev.startDate.toJSDate().toISOString().split("T")[0];
          return evDate === todayStr;
        }).length;
      }
    } catch (e) { console.error("Calendar Cron Error:", e); }

    // 4. Nachricht formulieren
    const putzText = faelligePutzaufgaben.length > 0 
      ? `🧹 Fällig heute: ${faelligePutzaufgaben.slice(0, 2).join(", ")}${faelligePutzaufgaben.length > 2 ? ` (+${faelligePutzaufgaben.length - 2} weitere)` : ""}`
      : "🧹 Keine dringenden Putzaufgaben!";

    const message = `Guten Morgen Jonas! ☀️ Heute ${temp}.\n📅 ${heuteTermineCount} Termine heute.\n${putzText}\n🛒 ${offeneEinkaeufeCount} Artikel auf der Einkaufsliste.`;

    // 5. Über ntfy versenden
    await fetch("https://ntfy.sh/HaushaltLenaJonas", {
      method: "POST",
      body: message,
      headers: {
        "Title": "🏠 Haushalt OS – Morgenbericht",
        "Tags": "sunrise,clipboard",
        "Priority": "default"
      }
    });

    return NextResponse.json({ success: true, sentMessage: message });
  } catch (error) {
    console.error("Cron Error:", error);
    return NextResponse.json({ error: "Fehler beim Cron Job" }, { status: 500 });
  }
}