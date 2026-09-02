import { NextResponse } from "next/server";

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

    // Verwende direkt die Daten aus dem Frontend-State
    const userRecords = (clientData || []).filter(
      (r: any) =>
        (r.username && r.username.toLowerCase() === user.toLowerCase()) ||
        (r.user && r.user.toLowerCase() === user.toLowerCase())
    );

    if (userRecords.length === 0) {
      return NextResponse.json({
        report: `Es liegen für Athlet "${user}" noch keine Trainingsdaten vor. Bitte prüfe, ob Workouts eingetragen sind.`
      });
    }

    // Trainings nach Datum gruppieren
    const sessionsByDate: Record<string, any[]> = {};
    userRecords.forEach((row: any) => {
      const d = row.datum || row.created_at || "Unbekannt";
      if (!sessionsByDate[d]) sessionsByDate[d] = [];
      sessionsByDate[d].push({
        uebung: row.uebung || row.exercise || row.name,
        gewicht: row.gewicht || row.weight || 0,
        reps: row.reps || row.wiederholungen || 0
      });
    });

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${apiKey}`;

    const res = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: {
          parts: [
            {
              text: `Du bist ein weltklasse Strength & Conditioning Coach und Sportwissenschaftler.
Antworte ZWINGEND und AUSNAHMSLOS auf DEUTSCH.
Deine Aufgabe ist ein unvoreingenommenes, absolut sachliches, evidenzbasiertes und gnadenlos ehrliches Performance-Audit der Trainingshistorie von Athlet "${user}".
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
                text: `Hier sind die vollständigen Trainingsprotokolle von Athlet ${user} sortiert nach Datum:\n\n${JSON.stringify(sessionsByDate, null, 2)}`
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 8192
        }
      })
    });

    if (!res.ok) {
      const errBody = await res.text();
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
    return NextResponse.json({ error: err.message || "Interner Serverfehler" }, { status: 500 });
  }
}
