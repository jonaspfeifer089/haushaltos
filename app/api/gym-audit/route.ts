import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  try {
    const { user, clientData } = await req.json();
    const targetUser = user || "Jonas";

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY fehlt in der Umgebung (.env.local)!" },
        { status: 500 }
      );
    }

    let records: any[] = [];

    // 1. Prüfen, ob Client-Daten valide übergeben wurden
    if (Array.isArray(clientData) && clientData.length > 0) {
      records = clientData;
    } else {
      // 2. Fallback: Direkt aus der Supabase-Tabelle 'gym' holen
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey =
        process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (supabaseUrl && supabaseKey) {
        const supabase = createClient(supabaseUrl, supabaseKey);
        const { data, error } = await supabase
          .from("gym")
          .select("id, username, datum, uebung, setnum, gewicht, reps")
          .ilike("username", targetUser)
          .order("datum", { ascending: true });

        if (!error && data && data.length > 0) {
          records = data;
        } else if (error) {
          console.error("Supabase-Query Fehler auf Tabelle 'gym':", error);
        }
      }
    }

    if (!records || records.length === 0) {
      return NextResponse.json({
        report: `Es konnten in der Tabelle "gym" keine Trainingsdaten für Athlet "${targetUser}" gefunden werden.`
      });
    }

    // Trainingsdaten nach Datum gruppieren
    const sessionsByDate: Record<string, any[]> = {};
    records.forEach((row: any) => {
      const d = row.datum || "Unbekannt";
      if (!sessionsByDate[d]) sessionsByDate[d] = [];
      sessionsByDate[d].push({
        uebung: row.uebung,
        satz: row.setnum ?? 1,
        gewicht: Number(row.gewicht ?? 0),
        reps: Number(row.reps ?? 0)
      });
    });

    const bodyPayload = {
      system_instruction: {
        parts: [
          {
            text: `Du bist ein weltklasse Strength & Conditioning Coach und Sportwissenschaftler.
Antworte ZWINGEND und AUSNAHMSLOS auf DEUTSCH.
Deine Aufgabe ist ein unvoreingenommenes, absolut sachliches, evidenzbasiertes und gnadenlos ehrliches Performance-Audit der Trainingshistorie von Athlet "${targetUser}".
Verboten sind: Floskeln, Schönfärberei, unangebrachtes Lob.
Wenn der Athlet stagniert, zu wenig Intensität zeigt, Übungen meidet oder unbalanciert trainiert, benenne es exakt mit Daten und Fakten.

Gliedere deine Analyse zwingend in folgende 5 Abschnitte:
1. 📊 MAKRO-ÜBERSICHT & KONSISTENZ (Frequenz, Entwicklung des Satz- und Tonnage-Volumens)
2. 📈 PROGRESSIVE OVERLOAD AUDIT (Wo gab es messbare Progression? Wo herrscht Stagnation oder Scheinsicherheit?)
3. ⚖️ ANATOMISCHE BALANCE & MUSKELKETTEN (Push vs. Pull, Verhältnis der Muskelgruppen, Disbalancen & Verletzungsrisiken)
4. 🥊 SCHONUNGSLOSE KRITIK & EFFIZIENZFRESSER (Was läuft objektiv ineffizient? Junk Volume, ineffiziente Satzstrukturen, fehlende Ausbelastung)
5. 🎯 DIE 3 PRIORITÄREN KORREKTUREN (Konkrete, sofort umsetzbare Vorgaben für den nächsten Trainingszyklus)`
          }
        ]
      },
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `Hier sind die vollständigen Trainingsprotokolle von Athlet ${targetUser} sortiert nach Datum:\n\n${JSON.stringify(sessionsByDate, null, 2)}`
            }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 4096
      }
    };

    // FIX: Explizite -latest Suffixe für die REST API, um 404 zu vermeiden.
    const candidateModels = ["gemini-1.5-flash-latest", "gemini-1.5-pro-latest", "gemini-pro"];

    let reportText: string | null = null;
    let lastError = "";

    for (const model of candidateModels) {
      try {
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 25000);

        const res = await fetch(geminiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(bodyPayload),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (res.ok) {
          const aiJson = await res.json();
          reportText = aiJson.candidates?.[0]?.content?.parts?.[0]?.text;
          if (reportText) break; // Erfolgreich -> Schleife abbrechen
        } else {
          lastError = await res.text();
          console.error(`Gemini Fehler mit Modell ${model}:`, lastError);
          // Bei 503 kurz warten vor dem nächsten Modell
          if (res.status === 503) {
            await new Promise((r) => setTimeout(r, 600));
          }
        }
      } catch (err: any) {
        lastError = err.message;
        console.error(`Fetch-Fehler bei ${model}:`, err.message);
      }
    }

    if (!reportText) {
      return NextResponse.json(
        { error: `Gemini-Analyse mit allen Modellen fehlgeschlagen. Letzter Fehler: ${lastError}` },
        { status: 502 }
      );
    }

    return NextResponse.json({ report: reportText });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Interner Serverfehler" }, { status: 500 });
  }
}
