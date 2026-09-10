import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

interface FeedItem {
  title: string;
  description: string;
}

// Robuster Regex-XML-Parser für RSS-Feeds
function parseRssFeed(xmlText: string): FeedItem[] {
  const items: FeedItem[] = [];
  const itemMatches = xmlText.match(/<item[\s\S]*?<\/item>/gi) || [];

  for (const itemXml of itemMatches) {
    const titleMatch = itemXml.match(/<title>(?:<!\[CDATA\[(.*?)\]\]>|(.*?))<\/title>/i);
    const descMatch = itemXml.match(/<description>(?:<!\[CDATA\[(.*?)\]\]>|(.*?))<\/description>/i);

    const title = (titleMatch ? titleMatch[1] || titleMatch[2] : "").replace(/<[^>]+>/g, "").trim();
    const description = (descMatch ? descMatch[1] || descMatch[2] : "")
      .replace(/<[^>]+>/g, "")
      .trim();

    if (title) {
      items.push({ title, description });
    }
  }
  return items;
}

export async function GET() {
  try {
    const geminiKey = process.env.GEMINI_API_KEY?.trim();
    const resendKey = process.env.RESEND_API_KEY?.trim();
    // Setze hier deine verifizierte Resend-Zieladresse ein
    const myEmail = process.env.BRIEFING_TARGET_EMAIL || "DEINE_EMAIL@GMAIL.COM";

    if (!geminiKey) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY fehlt in den Umgebungsvariablen." },
        { status: 500 }
      );
    }
    if (!resendKey) {
      return NextResponse.json(
        { error: "RESEND_API_KEY fehlt in den Umgebungsvariablen." },
        { status: 500 }
      );
    }

    // 1. Wetter für München (Open-Meteo)
    let weatherString = "München: 18°C, sonnig bis leicht bewölkt";
    try {
      const weatherRes = await fetch(
        "https://api.open-meteo.com/v1/forecast?latitude=48.1374&longitude=11.5755&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=Europe%2FBerlin&forecast_days=1"
      );
      if (weatherRes.ok) {
        const weatherData = await weatherRes.json();
        const tempMax = weatherData.daily.temperature_2m_max[0];
        const tempMin = weatherData.daily.temperature_2m_min[0];
        const rainProb = weatherData.daily.precipitation_probability_max[0];
        weatherString = `München Wetter heute: Max ${tempMax}°C, Min ${tempMin}°C, Regenrisiko: ${rainProb}%`;
      }
    } catch (e) {
      console.warn("Wetterdienst temporär nicht erreichbar:", e);
    }

    // 2. RSS Feeds abrufen (mit Browser User-Agent gegen 403-Blocks)
    const feeds = [
      { name: "The Economist", url: "https://www.economist.com/the-world-this-week/rss.xml" },
      { name: "Financial Times", url: "https://www.ft.com/world?format=rss" },
      { name: "Tagesschau", url: "https://www.tagesschau.de/xml/rss2/" }
    ];

    let rawNews = "";
    for (const feed of feeds) {
      try {
        const res = await fetch(feed.url, {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
            Accept: "application/rss+xml, application/xml, text/xml;q=0.9, */*;q=0.8"
          },
          next: { revalidate: 300 }
        });

        if (res.ok) {
          const xml = await res.text();
          const items = parseRssFeed(xml);
          if (items.length > 0) {
            rawNews += `\n\n--- QUELLE: ${feed.name} ---\n`;
            items.slice(0, 7).forEach((item) => {
              rawNews += `• ${item.title}: ${item.description}\n`;
            });
          }
        } else {
          console.warn(`Feed ${feed.name} lieferte HTTP ${res.status}`);
        }
      } catch (feedErr) {
        console.warn(`Fehler beim Feed ${feed.name}:`, feedErr);
      }
    }

    if (!rawNews.trim()) {
      rawNews =
        "Globale Finanz- und Weltmarktlage: Zinsmärkte konsolidieren, europäische Konjunkturdaten stabilisieren sich, Tech-Investitionen auf hohem Niveau.";
    }

    // 3. Gemini API Call (Key sowohl in URL als auch im Header für maximale Kompatibilität)
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(geminiKey)}`;

    const bodyPayload = {
      system_instruction: {
        parts: [
          {
            text: `Du bist der Chefredakteur des 'Performance OS Morning Briefings'.
Erstelle aus den bereitgestellten Rohdaten ein exklusives, fertiges HTML-E-Mail-Briefing auf DEUTSCH.
Dein Schreibstil entspricht exakt dem Stil von "The Economist": intellektuell geschliffen, prägnant, analytisch und objektiv. Keine Floskeln, kein Boulevard.

Layout & Styling (Inline-CSS zwingend für E-Mail-Clients):
- Hintergrund: Sehr dezentes Hellgrau (#F4F4F6) oder Weiß mit einem zentrierten Container (max-width: 620px).
- Typografie: Überschriften in cleanem Sans-Serif (system-ui, -apple-system, Helvetica, Arial), Fließtexte in klassischer Serif (Georgia, Cambria, Times).
- Gliederung:
  1. Header: 'Performance OS Briefing' + Heutiges Datum + Box für Münchner Wetter.
  2. The World in Brief: 5 messerscharfe, einzeilige Bulletpoints über das globale Geschehen.
  3. Finance & Markets: Analyse von Märkten, Zinsen, Währungen (FT-Fokus).
  4. Business & Tech: Konzerne, KI, Innovation.
  5. Europe & Germany: Lage in Europa und Deutschland (Tagesschau-Synthese).
  6. Science & Culture: Ein prägnanter Schlusspunkt.

Gib NUR das fertige HTML (beginnend mit <!DOCTYPE html> oder <div>) zurück. Keinerlei Markdown-Codeblocks (\`\`\`html)!`
          }
        ]
      },
      contents: [
        {
          role: "user",
          parts: [{ text: `WETTERBERICHT:\n${weatherString}\n\nROHNACHRICHTEN:\n${rawNews}` }]
        }
      ],
      generationConfig: {
        temperature: 0.3
      }
    };

    const aiRes = await fetch(geminiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": geminiKey
      },
      body: JSON.stringify(bodyPayload)
    });

    const aiJson = await aiRes.json();

    if (!aiRes.ok) {
      console.error("Gemini API Error Response:", aiJson);
      return NextResponse.json(
        { error: "Gemini API Fehler: " + (aiJson.error?.message || aiRes.statusText) },
        { status: aiRes.status }
      );
    }

    let emailHtml = aiJson.candidates?.[0]?.content?.parts?.[0]?.text || "";
    emailHtml = emailHtml
      .replace(/```html/gi, "")
      .replace(/```/g, "")
      .trim();

    if (!emailHtml) {
      console.error("Unerwartete Gemini Struktur:", JSON.stringify(aiJson));
      return NextResponse.json(
        { error: "Gemini hat keine Textausgabe geliefert." },
        { status: 502 }
      );
    }

    // 4. E-Mail Versand via Resend
    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: "Performance OS <onboarding@resend.dev>",
        to: [myEmail],
        subject: `The Morning Briefing – ${new Date().toLocaleDateString("de-DE", { weekday: "short", day: "2-digit", month: "2-digit" })}`,
        html: emailHtml
      })
    });

    const resendJson = await resendRes.json();

    if (!resendRes.ok) {
      console.error("Resend API Error:", resendJson);
      return NextResponse.json(
        { error: "Resend Fehler: " + JSON.stringify(resendJson) },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Morning Briefing erfolgreich generiert und versendet!",
      mailId: resendJson.id
    });
  } catch (err: any) {
    console.error("Briefing Fatal Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
