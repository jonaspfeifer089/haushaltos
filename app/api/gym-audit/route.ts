import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function POST(req: Request) {
  try {
    const { user } = await req.json();

    if (!user) {
      return NextResponse.json({ error: "Kein User übergeben" }, { status: 400 });
    }

    // 1. Alle bisherigen Trainingsdaten des Nutzers abrufen
    // (Anpassbar an deine Tabellenstruktur, z.B. gym_sessions, gym_sets, workouts)
    const { data: workouts, error: wError } = await supabase
      .from("gym_workouts")
      .select(
        `
        id,
        datum,
        plan_name,
        dauer_minuten,
        sets:gym_sets (
          uebung,
          muskelgruppe,
          gewicht,
          wiederholungen,
          rpe,
          satz_nummer
        )
      `
      )
      .eq("user", user)
      .order("datum", { ascending: true });

    // Fallback: Falls die Datenstruktur in einer flachen Tabelle liegt
    let trainingData = workouts;
    if (wError || !workouts || workouts.length === 0) {
      const { data: flatSets } = await supabase
        .from("gym_data")
        .select("*")
        .eq("user", user)
        .order("created_at", { ascending: true });
      trainingData = flatSets;
    }

    if (!trainingData || trainingData.length === 0) {
      return NextResponse.json({
        report:
          "Es liegen noch keine ausreichenden Trainingsdaten in der Datenbank vor, um eine valide statistische Analyse durchzuführen."
      });
    }

    // 2. System-Prompt für absolute Sachlichkeit & schonungslose Ehrlichkeit
    const systemPrompt = `Du bist ein weltklasse Strength & Conditioning Coach und Sportwissenschaftler.
Deine Aufgabe ist ein fundiertes, unvoreingenommenes, absolut sachliches und ehrliches Performance-Audit der vorliegenden Trainingsdaten.
Keine Floskeln, keine Schönfärberei, kein künstliches Lob. 
Wenn der Athlet stagniert, zu wenig Intensität zeigt, Übungen meidet oder unbalanciert trainiert, benenne es exakt mit Daten und Fakten.

Gliedere deine Analyse zwingend in folgende 5 Abschnitte:
1. 📊 MAKRO-ÜBERSICHT & ADHÄRENZ (Frequenz, Gesamtlvolumen, Konsistenz)
2. 📈 PROGRESSIVE OVERLOAD AUDIT (Wo gab es echte Progression? Wo herrscht Stagnation / Scheinsicherheit?)
3. ⚖️ ANATOMISCHE BALANCE & MUSKELGRUPPEN (Verhältnis Push/Pull/Legs, vernachlässigte Muskeln, Verletzungsrisiken)
4. 🥊 SCHONUNGSLOSE KRITIK & EFFIZIENZFRESSER (Was läuft objektiv falsch? Junk Volume, ineffiziente Satzstrukturen, fehlende RIR-Ausbelastung)
5. 🎯 DIE 3 PRIORITÄREN KORREKTUREN (Konkrete, sofort umsetzbare Vorgaben für den nächsten Trainingsblock)

Verwende präzise Terminologie (RPE, RIR, Mikro-/Mesozyklus, Hypertrophie-Schwellenwert, Tonnage).`;

    // 3. Aufruf an dein konfiguriertes LLM (z.B. OpenAI / Gemini)
    const apiKey = process.env.OPENAI_API_KEY || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Kein API Key für das KI-Modell konfiguriert." },
        { status: 500 }
      );
    }

    // Beispielhafte Anbindung via OpenAI-kompatiblem Endpoint
    const aiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4o",
        temperature: 0.2, // Sehr niedrig für maximale Sachlichkeit und Halluzinationsfreiheit
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: `Hier sind die vollständigen Trainingsprotokolle von Athlet ${user}:\n\n${JSON.stringify(trainingData, null, 2)}`
          }
        ]
      })
    });

    const aiJson = await aiResponse.json();
    const reportText =
      aiJson.choices?.[0]?.message?.content || "Analyse konnte nicht generiert werden.";

    return NextResponse.json({ report: reportText });
  } catch (err: any) {
    console.error("Gym Audit Error:", err);
    return NextResponse.json({ error: err.message || "Interner Serverfehler" }, { status: 500 });
  }
}
