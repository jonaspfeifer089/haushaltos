import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { user, clientData } = await req.json();

    if (!clientData || !Array.isArray(clientData) || clientData.length === 0) {
      return NextResponse.json({
        report: `Es wurden keine Trainingsdaten an die Analyse übergeben (Array ist leer).`
      });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY fehlt in der .env.local!" },
        { status: 500 }
      );
    }

    // Falls User-Feld existiert, filtern; sonst alle Daten verwenden
    let userRecords = clientData.filter((r: any) =>
      !r.username && !r.user
        ? true
        : r.username?.toLowerCase() === user?.toLowerCase() ||
          r.user?.toLowerCase() === user?.toLowerCase()
    );

    if (userRecords.length === 0) {
      userRecords = clientData;
    }

    // Trainings nach Datum gruppieren
    const sessionsByDate: Record<string, any[]> = {};
    userRecords.forEach((row: any) => {
      const d = row.datum || row.created_at || "Training";
      if (!sessionsByDate[d]) sessionsByDate[d] = [];
      sessionsByDate[d].push({
        uebung: row.uebung || row.exercise || row.name || "Übung",
        gewicht: Number(row.gewicht ?? row.weight ?? 0),
        reps: Number(row.reps ?? row.wiederholungen ?? 0)
      });
    });

    const payload = {
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
        maxOutputTokens: 4096
      }
    };

    // Offizielle existierende Modelle
    const validModels = ["gemini-1.5-flash", "gemini-1.5-pro"];
    let reportText: string | null = null;
    let lastErrorDetails = "";

    for (const model of validModels) {
      try {
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

        // Verhindert endloses Hängenbleiben (bricht nach 25 Sekunden hart ab)
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 25000);

        const res = await fetch(geminiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (res.ok) {
          const aiJson = await res.json();
          reportText = aiJson.candidates?.[0]?.content?.parts?.[0]?.text;
          if (reportText) break;
        } else {
          lastErrorDetails = await res.text();
          console.error(`Gemini Error (${model}):`, lastErrorDetails);
        }
      } catch (fetchErr: any) {
        lastErrorDetails = fetchErr.message;
        console.error(`Fetch Error (${model}):`, fetchErr.message);
      }
    }

    if (!reportText) {
      return NextResponse.json(
        { error: `Analyse fehlgeschlagen: ${lastErrorDetails || "Keine Antwort erhalten."}` },
        { status: 502 }
      );
    }

    return NextResponse.json({ report: reportText });
  } catch (err: any) {
    console.error("Gym Audit Route Error:", err);
    return NextResponse.json({ error: err.message || "Interner Serverfehler" }, { status: 500 });
  }
}
