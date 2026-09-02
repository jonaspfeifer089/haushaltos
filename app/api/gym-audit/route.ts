import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function POST(req: Request) {
  try {
    const { user, clientData } = await req.json();

    if (!user) {
      return NextResponse.json({ error: "Kein User übergeben" }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY fehlt in der .env.local!" },
        { status: 500 }
      );
    }

    let records = clientData;

    // Falls vom Client keine Daten mitgegeben wurden, Abfrage über Supabase
    if (!records || records.length === 0) {
      // Test 1: Spaltenname 'username'
      let { data, error } = await supabase
        .from("gym_data")
        .select("*")
        .eq("username", user)
        .order("datum", { ascending: true });

      // Test 2: Spaltenname 'user'
      if (error || !data || data.length === 0) {
        const fallback = await supabase
          .from("gym_data")
          .select("*")
          .eq("user", user)
          .order("datum", { ascending: true });

        if (!fallback.error && fallback.data) {
          data = fallback.data;
          error = null;
        }
      }

      if (error) {
        console.error("Detaillierter Supabase-Fehler:", error);
        return NextResponse.json(
          { error: `Datenbankfehler: ${error.message} (Code: ${error.code})` },
          { status: 500 }
        );
      }
      records = data;
    }

    // Nur Daten des aktuellen Users filtern (falls gemischt übergeben)
    const userRecords = (records || []).filter((r: any) => r.username === user || r.user === user);

    if (userRecords.length === 0) {
      return NextResponse.json({
        report: `Es liegen für Athlet "${user}" noch keine protokollierten Trainingssätze vor. Starte zuerst ein Workout und trage Sätze ein.`
      });
    }

    // Nach Datum aggregieren
    const sessionsByDate: Record<string, any[]> = {};
    userRecords.forEach((row: any) => {
      const d = row.datum || row.created_at || "Unbekannt";
      if (!sessionsByDate[d]) sessionsByDate[d] = [];
      sessionsByDate[d].push({
        uebung: row.uebung,
        gewicht: row.gewicht,
        reps: row.reps
      });
    });

    const systemPrompt = `Du bist ein weltklasse Strength & Conditioning Coach und Sportwissenschaftler.
Deine Aufgabe ist ein unvoreingenommenes, absolut sachliches, evidenzbasiertes und gnadenlos ehrliches Performance-Audit der Trainingshistorie von Athlet "${user}".
Verboten sind: Floskeln, Schönfärberei, unangebrachtes Schulterklopfen. 
Wenn der Athlet stagniert, zu wenig Intensität zeigt, Übungen meidet oder unbalanciert trainiert, benenne es exakt mit Daten und Fakten.

Gliedere deine Analyse zwingend in folgende Abschnitte:
1. 📊 MAKRO-ÜBERSICHT & KONSISTENZ (Frequenz, Entwicklung des Satz- und Tonnage-Volumens)
2. 📈 PROGRESSIVE OVERLOAD AUDIT (Wo gab es messbare Progression? Wo herrscht Stagnation oder Scheinsicherheit?)
3. ⚖️ ANATOMISCHE BALANCE & MUSKELKETTEN (Push vs. Pull, Verhältnis der Muskelgruppen, Disbalancen & Verletzungsrisiken)
4. 🥊 SCHONUNGSLOSE KRITIK & EFFIZIENZFRESSER (Was läuft objektiv ineffizient? Junk Volume, ineffiziente Satzstrukturen, fehlende Ausbelastung)
5. 🎯 DIE 3 PRIORITÄREN KORREKTUREN (Konkrete, sofort umsetzbare Vorgaben für den nächsten Trainingszyklus)`;

    const userContent = `Hier sind die vollständigen Trainingsprotokolle sortiert nach Datum:\n\n${JSON.stringify(sessionsByDate, null, 2)}`;

    // Gemini API Call
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    const res = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: `${systemPrompt}\n\n${userContent}` }]
          }
        ],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 2048
        }
      })
    });

    if (!res.ok) {
      const errBody = await res.text();
      console.error("Gemini API Error:", errBody);
      return NextResponse.json(
        { error: `Gemini API meldet Fehler (${res.status}): ${errBody}` },
        { status: 500 }
      );
    }

    const aiJson = await res.json();
    const reportText =
      aiJson.candidates?.[0]?.content?.parts?.[0]?.text || "Keine Antwort vom Modell generiert.";

    return NextResponse.json({ report: reportText });
  } catch (err: any) {
    console.error("Gym Audit Server Error:", err);
    return NextResponse.json({ error: err.message || "Interner Serverfehler" }, { status: 500 });
  }
}
