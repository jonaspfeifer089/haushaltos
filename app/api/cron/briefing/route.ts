import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import ICAL from "ical.js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(request: Request) {
  const errors: string[] = [];
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://haushaltos.vercel.app";
  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];
  const dayOfWeek = today.getDay(); // 0 = So, 1 = Mo, 2 = Di, 3 = Mi, 4 = Do, 5 = Fr, 6 = Sa

  // 1. Live-Wetter Erfurt abrufen
  let temp = "--";
  let weatherTip = "Schoenen Tag!";
  try {
    const weatherRes = await fetch(
      "https://api.open-meteo.com/v1/forecast?latitude=50.9803&longitude=11.0291&current=temperature_2m,weather_code"
    );
    const weatherData = await weatherRes.json();
    const t = Math.round(weatherData?.current?.temperature_2m ?? 0);
    const code = weatherData?.current?.weather_code ?? 0;
    temp = `${t}°C`;
    if (code >= 51 && code <= 67) weatherTip = "🌧️ Regen gemeldet (Schirm mitnehmen!)";
    else if (t >= 23) weatherTip = "☀️ Warm & sonnig";
    else if (t <= 5) weatherTip = "🧣 Kalt draussen";
  } catch (e: any) {
    errors.push(`Wetter: ${e.message}`);
  }

  // 2. Gym Workout Plan (Di/Mi & Sa/So Split)
  let gymPlanJonas = "";
  switch (dayOfWeek) {
    case 2: // Di
      gymPlanJonas = "🏋️ Heute: PULL DAY (Ruecken/Bizeps)!";
      break;
    case 3: // Mi
      gymPlanJonas = "🏋️ Heute: PUSH DAY (Brust/Schulter/Trizeps)!";
      break;
    case 6: // Sa
      gymPlanJonas = "🏋️ Heute: PULL DAY (Ruecken/Bizeps)!";
      break;
    case 0: // So
      gymPlanJonas = "🏋️ Heute: PUSH DAY (Brust/Schulter/Trizeps)!";
      break;
    default: // Mo, Do, Fr
      gymPlanJonas = "🔋 Heute: REST DAY (Regeneration & Mobility).";
      break;
  }

  // 3. Daten aus Supabase abrufen (Putzplan, To-Dos, Einkauf, Meilensteine)
  let offeneTodosCount = 0;
  let offeneEinkaufCount = 0;
  const faelligePutzaufgaben: string[] = [];
  let naechsterMeilenstein: { title: string; tage: number } | null = null;

  try {
    const [todosRes, einkaufRes, haushaltRes, countdownsRes] = await Promise.all([
      supabase.from("todos").select("*", { count: "exact" }).eq("status", "Offen"),
      supabase.from("einkauf").select("*", { count: "exact" }).eq("status", "Offen"),
      supabase.from("haushalt").select("*"),
      supabase.from("countdowns").select("*")
    ]);

    offeneTodosCount = todosRes.count || 0;
    offeneEinkaufCount = einkaufRes.count || 0;

    // Faellige Putzaufgaben berechnen
    if (haushaltRes.data) {
      haushaltRes.data.forEach((item: any) => {
        if (item.letztes_datum && item.intervall) {
          const diffDays = Math.floor(
            (today.getTime() - new Date(item.letztes_datum).getTime()) / (1000 * 60 * 60 * 24)
          );
          if (diffDays >= parseInt(item.intervall, 10)) {
            faelligePutzaufgaben.push(item.aufgabe);
          }
        }
      });
    }

    // Naechsten Meilenstein berechnen
    if (countdownsRes.data && countdownsRes.data.length > 0) {
      const futureCds = countdownsRes.data
        .map((c: any) => {
          const diffDays = Math.ceil(
            (new Date(c.date).getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
          );
          return { title: c.title, tage: diffDays };
        })
        .filter((c: any) => c.tage >= 0)
        .sort((a: any, b: any) => a.tage - b.tage);

      if (futureCds.length > 0) naechsterMeilenstein = futureCds[0];
    }
  } catch (e: any) {
    errors.push(`Supabase: ${e.message}`);
  }

  // 4. iCloud Kalender Termine heute
  let heuteTermineCount = 0;
  try {
    const ICS_URL = process.env.APPLE_CALENDAR_URL;
    if (ICS_URL) {
      const calRes = await fetch(ICS_URL);
      const text = await calRes.text();
      const jcal = ICAL.parse(text);
      const comp = new ICAL.Component(jcal);
      const vevents = comp.getAllSubcomponents("vevent");

      heuteTermineCount = vevents.filter((vevent: any) => {
        try {
          return (
            new ICAL.Event(vevent).startDate.toJSDate().toISOString().split("T")[0] === todayStr
          );
        } catch {
          return false;
        }
      }).length;
    }
  } catch (e: any) {
    errors.push(`Kalender: ${e.message}`);
  }

  // 5. Texte zusammensetzen
  const putzText =
    faelligePutzaufgaben.length > 0
      ? `🧹 Putzen faellig: ${faelligePutzaufgaben.slice(0, 2).join(", ")}${faelligePutzaufgaben.length > 2 ? ` (+${faelligePutzaufgaben.length - 2})` : ""}`
      : "🧹 Haushalt ist top in Schuss!";

  const cdText = naechsterMeilenstein
    ? `\n⏳ Noch ${naechsterMeilenstein.tage} Tage bis "${naechsterMeilenstein.title}"`
    : "";

  const createBodyJonas = () =>
    `Guten Morgen Jonas! ☀️ ${temp} (${weatherTip})\n${gymPlanJonas}\n📅 ${heuteTermineCount} Termine heute\n${putzText}\n📋 ${offeneTodosCount} To-Dos | 🛒 ${offeneEinkaufCount} Einkaeufe${cdText}`;

  const createBodyLena = () =>
    `Guten Morgen Lena! ☀️ ${temp} (${weatherTip})\n📅 ${heuteTermineCount} Termine heute\n${putzText}\n📋 ${offeneTodosCount} To-Dos | 🛒 ${offeneEinkaufCount} Einkaeufe${cdText}`;

  // 6. ntfy Push versenden (ASCII-konforme Header gegen ByteString-Fehler)
  try {
    await Promise.all([
      fetch("https://ntfy.sh/HaushaltJonas", {
        method: "POST",
        body: createBodyJonas(),
        headers: {
          Title: "Guten Morgen Jonas",
          Tags:
            dayOfWeek === 2 || dayOfWeek === 3 || dayOfWeek === 6 || dayOfWeek === 0
              ? "muscle,sunny"
              : "sunrise,coffee",
          Priority: "default",
          Actions: `view, App oeffnen, ${appUrl}`
        }
      }),
      fetch("https://ntfy.sh/HaushaltLena", {
        method: "POST",
        body: createBodyLena(),
        headers: {
          Title: "Guten Morgen Lena",
          Tags: "sparkles,coffee",
          Priority: "default",
          Actions: `view, App oeffnen, ${appUrl}`
        }
      })
    ]);

    return NextResponse.json({
      success: true,
      briefingJonas: createBodyJonas(),
      briefingLena: createBodyLena(),
      warnings: errors.length > 0 ? errors : undefined
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: "Fehler beim ntfy Senden", details: e.message },
      { status: 500 }
    );
  }
}
