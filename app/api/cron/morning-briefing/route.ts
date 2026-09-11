import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const maxDuration = 60; // Bis zu 60s Execution-Time für Vercel Pro/Hobby

interface FeedItem {
  title: string;
  description: string;
}

interface CalendarEvent {
  summary: string;
  time: string;
  timestamp: number;
}

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

async function fetchAggregatedCalendarEvents(icsUrls: string[]): Promise<string> {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat("de-DE", {
    timeZone: "Europe/Berlin",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  });

  const [day, month, year] = formatter.format(now).split(".");
  const todayYYYYMMDD = `${year}${month}${day}`;
  const todayMMDD = `${month}${day}`;

  const allEvents: CalendarEvent[] = [];

  for (const url of icsUrls) {
    try {
      const httpsUrl = url.replace(/^webcal:\/\//i, "https://");
      const res = await fetch(httpsUrl, { next: { revalidate: 60 } });
      if (!res.ok) continue;

      const icsText = await res.text();
      const veventBlocks = icsText.split("BEGIN:VEVENT");

      for (let i = 1; i < veventBlocks.length; i++) {
        const block = veventBlocks[i].split("END:VEVENT")[0];

        const dtstartMatch = block.match(/DTSTART(?:;[^:]+)?:(\d{8})(?:T(\d{4}))?/);
        const summaryMatch = block.match(/SUMMARY:(.*)/);
        const rruleMatch = block.match(/RRULE:(.*)/);

        if (dtstartMatch && summaryMatch) {
          const eventDate = dtstartMatch[1];
          const rawTime = dtstartMatch[2];
          const isYearly = rruleMatch ? rruleMatch[1].includes("FREQ=YEARLY") : false;

          const isTodayExact = eventDate === todayYYYYMMDD;
          const isTodayRecurring = isYearly && eventDate.slice(4, 8) === todayMMDD;

          if (isTodayExact || isTodayRecurring) {
            let timeLabel = "Ganztägig";
            let sortTimestamp = 0;

            if (rawTime && !isYearly) {
              const hours = rawTime.slice(0, 2);
              const minutes = rawTime.slice(2, 4);
              timeLabel = `${hours}:${minutes} Uhr`;
              sortTimestamp = parseInt(hours, 10) * 60 + parseInt(minutes, 10);
            }

            const cleanSummary = summaryMatch[1].replace(/\\,/g, ",").replace(/\\n/g, " ").trim();
            allEvents.push({
              summary: cleanSummary,
              time: timeLabel,
              timestamp: sortTimestamp
            });
          }
        }
      }
    } catch (err) {
      console.warn("Fehler beim Kalender-Sync:", err);
    }
  }

  if (allEvents.length === 0) {
    return "Keine Termine eingetragen. Voller Fokusraum.";
  }

  allEvents.sort((a, b) => a.timestamp - b.timestamp);
  return allEvents.map((e) => `${e.time} | ${e.summary}`).join("\n");
}

export async function GET() {
  try {
    const geminiKey = process.env.GEMINI_API_KEY?.trim();
    const resendKey = process.env.RESEND_API_KEY?.trim();
    const myEmail = process.env.BRIEFING_TARGET_EMAIL || "werbung.jns@gmail.com";

    const myCalendarUrls = [
      "https://p45-caldav.icloud.com/published/2/MTYzNjM0MTI0MjExNjM2M1r9_RM37mGdFBnt5dTR2VnvqTWVyvVl_2UiLhNLybbS-G4Bs_Qn3X9Wm2_3nTUaBk5kOakknwxXdWsTzazR44U",
      "https://p45-caldav.icloud.com/published/2/MTYzNjM0MTI0MjExNjM2M1r9_RM37mGdFBnt5dTR2VlDIDhIY-nJHvxbWixkkCQIQEwQZrhgc9qUdwossecLsQag1ldyMeus3CyyT8MmBtU",
      "https://p45-caldav.icloud.com/published/2/MTYzNjM0MTI0MjExNjM2M1r9_RM37mGdFBnt5dTR2VkxAwiyAF-9Uk1Sh6tTfNZ5UvQ5ZYrWzNZpZF7QaMpPOjUGvn6Rz_HzucNxcdNS078"
    ];

    if (!geminiKey || !resendKey) {
      return NextResponse.json(
        { error: "API Keys fehlen in den Umgebungsvariablen." },
        { status: 500 }
      );
    }

    const todayFormatted = new Intl.DateTimeFormat("de-DE", {
      timeZone: "Europe/Berlin",
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric"
    }).format(new Date());

    // 1. Wetter München (Open-Meteo & QuickChart)
    let weatherSummary = "18°C · Heiter";
    let weatherChartUrl = "";
    try {
      const weatherRes = await fetch(
        "https://api.open-meteo.com/v1/forecast?latitude=48.1374&longitude=11.5755&hourly=temperature_2m,precipitation_probability&daily=temperature_2m_max,temperature_2m_min&timezone=Europe%2FBerlin&forecast_days=1"
      );
      if (weatherRes.ok) {
        const weatherData = await weatherRes.json();
        const tempMax = Math.round(weatherData.daily.temperature_2m_max[0]);
        const tempMin = Math.round(weatherData.daily.temperature_2m_min[0]);
        weatherSummary = `Max: ${tempMax}°C · Min: ${tempMin}°C`;

        const hours = ["06h", "09h", "12h", "15h", "18h", "21h"];
        const indices = [6, 9, 12, 15, 18, 21];
        const temps = indices.map((h) => Math.round(weatherData.hourly.temperature_2m[h]));
        const rain = indices.map((h) => weatherData.hourly.precipitation_probability[h]);

        const chartConfig = {
          type: "bar",
          data: {
            labels: hours,
            datasets: [
              {
                type: "line",
                label: "Temp",
                borderColor: "#38BDF8",
                backgroundColor: "rgba(56, 189, 248, 0.08)",
                borderWidth: 2.5,
                pointRadius: 3,
                fill: true,
                data: temps,
                yAxisID: "yTemp"
              },
              {
                type: "bar",
                label: "Regen",
                backgroundColor: "rgba(226, 232, 240, 0.9)",
                data: rain,
                yAxisID: "yRain",
                barThickness: 14
              }
            ]
          },
          options: {
            legend: { display: false },
            scales: {
              xAxes: [
                { gridLines: { display: false }, ticks: { fontSize: 9, fontColor: "#94A3B8" } }
              ],
              yAxes: [
                {
                  id: "yTemp",
                  position: "left",
                  gridLines: { color: "rgba(241, 245, 249, 1)" },
                  ticks: { fontSize: 9, fontColor: "#0284C7" }
                },
                {
                  id: "yRain",
                  position: "right",
                  gridLines: { display: false },
                  ticks: { min: 0, max: 100, fontSize: 9, fontColor: "#94A3B8" }
                }
              ]
            }
          }
        };

        weatherChartUrl = `https://quickchart.io/chart?w=560&h=170&devicePixelRatio=2&c=${encodeURIComponent(JSON.stringify(chartConfig))}`;
      }
    } catch (e) {
      console.warn("Wetterdienst Warnung:", e);
    }

    // 2. Kalender laden
    const calendarEventsText = await fetchAggregatedCalendarEvents(myCalendarUrls);

    // 3. News laden
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
              "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
            Accept: "application/rss+xml, application/xml, text/xml;q=0.9, */*;q=0.8"
          },
          next: { revalidate: 300 }
        });

        if (res.ok) {
          const xml = await res.text();
          const items = parseRssFeed(xml);
          if (items.length > 0) {
            rawNews += `\n\n--- ${feed.name} ---\n`;
            items.slice(0, 6).forEach((item) => {
              rawNews += `• ${item.title}: ${item.description}\n`;
            });
          }
        }
      } catch (feedErr) {
        console.warn(`Fehler bei ${feed.name}:`, feedErr);
      }
    }

    if (!rawNews.trim()) {
      rawNews = "Märkte stabilisieren sich bei moderater Handelsaktivität.";
    }

    // 4. Payload & Gemini Pipeline
    const bodyPayload = {
      system_instruction: {
        parts: [
          {
            text: `Du bist der Executive Editor des 'Performance OS Morning Briefings'.
Erstelle aus den Daten ein visuell atemberaubendes, hochmodernes HTML-E-Mail-Briefing auf DEUTSCH.
Look: Ultramodern, wie ein kuratiertes Tech-Dashboard (Linear/Apple/Monocle). Keine endlosen Textwände.

STRIKTE DESIGN-RICHTLINIEN (Inline-CSS):
- Base Font: font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif;
- Background Canvas: #0F172A (dunkler Hintergrund für Clients)
- Main Container: max-width: 600px; margin: 24px auto; background: #FFFFFF; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.15);

STRUKTUR:
1. HEADER:
   Dunkler Header-Block (background: #0B1120; padding: 24px 24px 20px 24px; color: #FFFFFF):
   - Status: <span style="display:inline-block; width:8px; height:8px; background:#10B981; border-radius:50%; margin-right:6px;"></span> <span style="color:#94A3B8; font-size:11px; letter-spacing:1px; text-transform:uppercase; font-weight:600;">DAILY EXECUTIVE REPORT</span>
   - Titel: <h1 style="font-size: 22px; font-weight: 700; margin: 8px 0 2px 0; letter-spacing: -0.5px; color:#F8FAFC;">Morning Briefing</h1>
   - Datum: <p style="font-size: 13px; color: #94A3B8; margin: 0;">${todayFormatted}</p>

2. AGENDA & TAGESSTRUKTUR (Cards):
   (padding: 24px;)
   - Geburtstage mit auffälligem Badge hervorheben: <span style="background:#FDF2F8; color:#DB2777; font-size:11px; font-weight:700; padding:3px 8px; border-radius:6px; border:1px solid #FBCFE8;">🎉 GEBURTSTAG</span>
   - Normale Termine als klare Liste mit Uhrzeit in fett (#0F172A).
   - Darunter 1 fokussierter Satz zum Tagesfokus.

3. WETTER MÜNCHEN:
   Abgerundete Card (background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 14px 16px; margin-bottom: 24px;):
   - Textzeile: <strong>München</strong> · ${weatherSummary}
   - Eingebettetes Diagramm: <img src="${weatherChartUrl}" alt="Wetterverlauf" style="width: 100%; max-width: 550px; height: auto; border-radius: 6px; margin-top: 10px; display: block;" />

4. THE EXECUTIVE SCAN (Top 3 Signals des Tages):
   3 wichtigste Geschehnisse. Jedes Signal exakt so formatieren:
   <div style="margin-bottom: 20px; padding-bottom: 16px; border-bottom: 1px solid #F1F5F9;">
     <div style="font-size: 15px; font-weight: 700; color: #0F172A; margin-bottom: 4px;">[Schlagzeile]</div>
     <div style="font-size: 13.5px; color: #475569; line-height: 1.55; margin-bottom: 8px;">[Kontext in max. 2 Sätzen]</div>
     <div style="background: #F0F9FF; border-left: 3px solid #0EA5E9; padding: 6px 10px; border-radius: 0 4px 4px 0; font-size: 12.5px; color: #0369A1; line-height: 1.45;">
       <strong>IMPLIKATION:</strong> [Konkreter Hebel / Relevanz]
     </div>
   </div>

5. PERSPECTIVE / DEEP DIVE:
   Ein pointierter Absatz im Stil von 'The Economist' zur Marktdynamik, abgeschlossen mit einer Mini-Implikationsbox.

6. FOOTER:
   <div style="text-align: center; padding: 18px; background: #F8FAFC; border-top: 1px solid #E2E8F0; font-size: 11px; color: #94A3B8;">
     Performance OS · Automatisierter Executive Intelligence Dienst
   </div>

Gib NUR das fertige HTML zurück. Keine Markdown-Backticks (\`\`\`html)!`
          }
        ]
      },
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `DATUM: ${todayFormatted}\nWETTER-INFO: ${weatherSummary}\nKALENDER: ${calendarEventsText}\nNEWS-FEEDS: ${rawNews}`
            }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.2
      }
    };

    // Kaskadierende Modell-Pipeline (fängt High-Demand- und 503-Fehler ab)
    const modelCandidates = [
      "gemini-3.6-flash",
      "gemini-3.5-flash",
      "gemini-3.1-flash-lite",
      "gemini-flash-latest"
    ];

    let emailHtml = "";
    let lastErrorMsg = "";

    for (const modelName of modelCandidates) {
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${encodeURIComponent(geminiKey)}`;

      try {
        console.log(`Starte Gemini-Generierung mit Modell: ${modelName}...`);
        const aiRes = await fetch(geminiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": geminiKey
          },
          body: JSON.stringify(bodyPayload)
        });

        const aiJson = await aiRes.json();

        if (aiRes.ok) {
          const rawText = aiJson.candidates?.[0]?.content?.parts?.[0]?.text || "";
          emailHtml = rawText
            .replace(/```html/gi, "")
            .replace(/```/g, "")
            .trim();
          if (emailHtml) {
            console.log(`Erfolgreich generiert mit: ${modelName}`);
            break;
          }
        } else {
          lastErrorMsg = aiJson.error?.message || aiRes.statusText;
          console.warn(
            `Modell ${modelName} abgewiesen (${aiRes.status}): ${lastErrorMsg}. Versuche Fallback...`
          );
          await new Promise((resolve) => setTimeout(resolve, 800));
        }
      } catch (reqErr: any) {
        lastErrorMsg = reqErr.message;
        console.warn(`Netzwerk-Exception bei Modell ${modelName}:`, reqErr);
      }
    }

    if (!emailHtml) {
      return NextResponse.json(
        { error: `Alle AI-Modelle derzeit überlastet. Letzter Fehler: ${lastErrorMsg}` },
        { status: 503 }
      );
    }

    // 5. E-Mail Versand via Resend
    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: "Performance OS <onboarding@resend.dev>",
        to: [myEmail],
        subject: `Executive Intelligence — ${todayFormatted}`,
        html: emailHtml
      })
    });

    const resendJson = await resendRes.json();

    if (!resendRes.ok) {
      return NextResponse.json(
        { error: "Resend Fehler: " + JSON.stringify(resendJson) },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Morning Briefing erfolgreich generiert und zugestellt!",
      mailId: resendJson.id
    });
  } catch (err: any) {
    console.error("Briefing Fatal Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
