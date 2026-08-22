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
  const errors: string[] = [];

  // 1. Wetter abrufen
  let temp = "--";
  try {
    const weatherRes = await fetch("https://api.open-meteo.com/v1/forecast?latitude=48.1764&longitude=11.5311&current=temperature_2m");
    const weatherData = await weatherRes.json();
    temp = `${weatherData?.current?.temperature_2m ?? "--"}°C`;
  } catch (e: any) { errors.push(`Wetter: ${e.message}`); }

  // 2. Google Sheets Daten
  let offeneEinkaeufeCount = 0;
  let faelligePutzaufgaben: string[] = [];
  let naechsterCountdown: { title: string; tage: number } | null = null;

  try {
    const sheets = google.sheets({ version: "v4", auth: getAuth() });
    const [einkaufRes, haushaltRes, countdownsRes] = await Promise.all([
      sheets.spreadsheets.values.get({ spreadsheetId, range: "Einkauf!A:B" }),
      sheets.spreadsheets.values.get({ spreadsheetId, range: "Haushalt!A:D" }),
      sheets.spreadsheets.values.get({ spreadsheetId, range: "Countdowns!A:C" }).catch(() => ({ data: { values: [] } }))
    ]);

    const einkaufRows = einkaufRes.data.values?.slice(1) || [];
    offeneEinkaeufeCount = einkaufRows.filter(r => r[0] && r[1] !== "Erledigt").length;

    const haushaltRows = haushaltRes.data.values?.slice(1) || [];
    const now = new Date();
    haushaltRows.forEach(row => {
      const aufgabe = row[0];
      const letztesDatumStr = row[1];
      const intervallTage = parseInt(row[2] || "7", 10);
      if (aufgabe && letztesDatumStr) {
        const diffTage = Math.floor((now.getTime() - new Date(letztesDatumStr).getTime()) / (1000 * 60 * 60 * 24));
        if (diffTage >= intervallTage) faelligePutzaufgaben.push(aufgabe);
      }
    });

    const countdownRows = countdownsRes.data.values?.slice(1) || [];
    const futureCountdowns = countdownRows.map(r => {
      const targetDate = new Date(r[1]);
      const diffTage = Math.ceil((targetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return { title: r[0], tage: diffTage };
    }).filter(c => c.title && c.tage >= 0).sort((a, b) => a.tage - b.tage);

    if (futureCountdowns.length > 0) naechsterCountdown = futureCountdowns[0];
  } catch (e: any) { errors.push(`Sheets: ${e.message}`); }

  // 3. Kalender Termine heute
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
        try {
          return new ICAL.Event(vevent).startDate.toJSDate().toISOString().split("T")[0] === todayStr;
        } catch { return false; }
      }).length;
    }
  } catch (e: any) { errors.push(`Kalender: ${e.message}`); }

  // 4. Personalisierte Nachrichtengenerierung
  const { searchParams } = new URL(request.url);
  const targetUser = searchParams.get("user");

  const putzText = faelligePutzaufgaben.length > 0 
    ? `🧹 Fällig: ${faelligePutzaufgaben.slice(0, 2).join(", ")}${faelligePutzaufgaben.length > 2 ? ` (+${faelligePutzaufgaben.length - 2})` : ""}` 
    : "🧹 Alles sauber im Haushalt!";
  
  const countdownText = naechsterCountdown 
    ? `\n⏳ Countdown: Noch ${naechsterCountdown.tage} Tage bis "${naechsterCountdown.title}"!`
    : "";

  const createBody = (name: string) => 
    `Guten Morgen ${name}! ☀️ Heute ${temp}.\n📅 ${heuteTermineCount} Termine heute.\n${putzText}\n🛒 ${offeneEinkaeufeCount} Artikel auf der Einkaufsliste.${countdownText}`;

  // 5. ntfy Push versenden
  try {
    if (targetUser) {
      // Manueller Test-Trigger für eine spezifische Person
      await fetch("https://ntfy.sh/HaushaltLenaJonas", {
        method: "POST",
        body: createBody(targetUser),
        headers: {
          "Title": `Haushalt OS - Briefing fuer ${targetUser}`,
          "Tags": "sunrise,sparkles",
          "Priority": "default"
        }
      });
    } else {
      // Automatischer Vercel Cron: Sendet an den gemeinsamen Kanal
      await fetch("https://ntfy.sh/HaushaltLenaJonas", {
        method: "POST",
        body: createBody("Jonas & Lena"),
        headers: {
          "Title": "Haushalt OS - Morgenbericht",
          "Tags": "house,sunrise,clipboard",
          "Priority": "default"
        }
      });
    }

    return NextResponse.json({ 
      success: true, 
      sentMessage: targetUser ? createBody(targetUser) : createBody("Jonas & Lena"),
      warnings: errors.length > 0 ? errors : undefined 
    });
  } catch (e: any) {
    return NextResponse.json({ error: "Fehler beim ntfy Senden", details: e.message }, { status: 500 });
  }
}