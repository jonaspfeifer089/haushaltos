import { NextResponse } from "next/server";
import Parser from "rss-parser";

// Vercel Cron-Security: Optional, aber empfohlen
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    // 1. API Keys prüfen
    const geminiKey = process.env.GEMINI_API_KEY;
    const resendKey = process.env.RESEND_API_KEY;
    const myEmail = "DEINE_EMAIL_ADRESSE@GMAIL.COM"; // <-- HIER DEINE EMAIL EINTRAGEN

    if (!geminiKey || !resendKey) {
      return NextResponse.json({ error: "API Keys fehlen" }, { status: 500 });
    }

    // 2. Wetter für München (Open-Meteo)
    const weatherRes = await fetch(
      "https://api.open-meteo.com/v1/forecast?latitude=48.1374&longitude=11.5755&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=Europe%2FBerlin&forecast_days=1"
    );
    const weatherData = await weatherRes.json();
    const tempMax = weatherData.daily.temperature_2m_max[0];
    const tempMin = weatherData.daily.temperature_2m_min[0];
    const rainProb = weatherData.daily.precipitation_probability_max[0];
    const weatherString = `München Wetter heute: Max ${tempMax}°C, Min ${tempMin}°C, Regenwahrscheinlichkeit: ${rainProb}%`;

    // 3. RSS Feeds abrufen
    const parser = new Parser();
    const feeds = [
      { name: "The Economist", url: "https://www.economist.com/the-world-this-week/rss.xml" },
      { name: "Financial Times", url: "https://www.ft.com/?format=rss" },
      { name: "Tagesschau", url: "https://www.tagesschau.de/xml/rss2/" }
    ];

    let rawNews = "";
    for (const feed of feeds) {
      try {
        const parsed = await parser.parseURL(feed.url);
        rawNews += `\n\nQUELLE: ${feed.name}\n`;
        // Nur die Top 8 Artikel pro Quelle nehmen, um Token zu sparen
        parsed.items.slice(0, 8).forEach((item) => {
          rawNews += `- ${item.title} (${item.contentSnippet || item.content})\n`;
        });
      } catch (e) {
        console.error(`Fehler bei ${feed.name}:`, e);
      }
    }

    // 4. Gemini Prompt & KI-Analyse
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`;

    const bodyPayload = {
      system_instruction: {
        parts: [
          {
            text: `Du bist der Chefredakteur des elitären 'Performance OS Morning Briefings'.
Deine Aufgabe ist es, aus den rohen Nachrichten-Feeds und dem Wetterbericht ein elegantes, fertiges HTML-E-Mail-Briefing auf DEUTSCH zu erstellen.
Dein Stil ist exakt wie "The Economist": intellektuell, scharfsinnig, objektiv, mit einer Prise britischem Understatement. Keine Panikmache, sondern kühle Analytik.

Generiere AUSSCHLIESSLICH validen HTML-Code, der direkt in einer E-Mail gerendert werden kann. Nutze Inline-CSS, serifenlose Fonts für Überschriften (Arial, Helvetica) und Serif-Fonts für Fließtexte (Georgia, Times New Roman). Nutze elegantes Design (viel Weißraum, Trennlinien, dezentes Grau für Daten).

Strukturiere das HTML zwingend so:
1. HEADER: "Performance OS Briefing" (groß, elegant) + Heutiges Datum + Wetter für München (schick formatiert).
2. THE WORLD IN BRIEF: 5 messerscharfe One-Liner (Bulletpoints) zu den global wichtigsten News der letzten Stunden.
3. FINANCE & MARKETS: 2-3 zusammenhängende Absätze zu Wirtschaft, Zinsen, Währungen.
4. BUSINESS & TECH: Fokus auf Unternehmen, KI, Industrie.
5. EUROPE & GERMANY: Politische und gesellschaftliche Lage.
6. SCIENCE & CULTURE: Ein abschließendes, horizont-erweiterndes Schlaglicht.

Ignoriere irrelevante News, eliminiere Dopplungen (besonders wenn FT und Economist das Gleiche berichten, mach eine clevere Synthese daraus).
Gib nur das HTML aus, keine Markdown-Blöcke (\`\`\`html) drumherum!`
          }
        ]
      },
      contents: [
        { role: "user", parts: [{ text: `WETTER:\n${weatherString}\n\nNACHRICHTEN:\n${rawNews}` }] }
      ],
      generationConfig: { temperature: 0.3 }
    };

    const aiRes = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(bodyPayload)
    });

    const aiJson = await aiRes.json();
    let emailHtml = aiJson.candidates?.[0]?.content?.parts?.[0]?.text || "";

    // Bereinige versehentliche Markdown-Blöcke der KI
    emailHtml = emailHtml
      .replace(/```html/gi, "")
      .replace(/```/g, "")
      .trim();

    if (!emailHtml) {
      throw new Error("Gemini hat kein HTML generiert.");
    }

    // 5. E-Mail per Resend versenden
    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: "Performance OS <onboarding@resend.dev>",
        to: [myEmail],
        subject: `Morning Briefing – ${new Date().toLocaleDateString("de-DE")}`,
        html: emailHtml
      })
    });

    if (!resendRes.ok) {
      const errorText = await resendRes.text();
      console.error("Resend Fehler:", errorText);
      return NextResponse.json({ error: "Fehler beim E-Mail Versand" }, { status: 502 });
    }

    return NextResponse.json({ success: true, message: "Morning Briefing erfolgreich versendet!" });
  } catch (err: any) {
    console.error("Briefing Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
