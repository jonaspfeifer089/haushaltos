import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

export async function POST(req: Request) {
  try {
    const { input, defaultUser } = await req.json();
    if (!input || !input.trim())
      return NextResponse.json({ error: "Kein Text übergeben" }, { status: 400 });

    const apiKey = process.env.GEMINI_API_KEY;

    if (apiKey) {
      try {
        const ai = new GoogleGenAI({ apiKey });
        const prompt = `Du bist ein hochpräziser Task-Parsing-Assistent für das Dashboard von Jonas und Lena.
Deine Aufgabe ist es, gesprochene Sprache in knackige, professionelle Aufgaben/Einträge zu transformieren.

Input: "${input}"

STRENGE REGELN FÜR "text":
- Verwandle gelaberte Sätze in kurze, präzise Action-Items (Maximal 3-6 Wörter).
- KEINE Füllwörter wie "sich", "noch", "heute", "bitte", "mal", "irgendwie", "um ein".
- Beispiele:
  - "Jonas soll sich heute noch Gedanken um ein Geschenk für Mama machen" -> "Geschenk für Mama überlegen"
  - "wir müssen unbedingt mal wieder das Bad putzen" -> "Bad gründlich putzen"
  - "Lena kauf bitte Hafermilch und Eier" -> "Hafermilch und Eier"
  - "WLAN Passwort ist 123456" -> "WLAN Passwort: 123456"

REGELN FÜR "type":
- "einkauf": Wenn es um Produkte/Lebensmittel geht, die im Laden besorgt werden.
- "notiz": Wenn es Passwörter, Ideen, Notizen oder Codes sind.
- "todo": Für alle Handlungen, Termine, To-Dos und Aufgaben.

REGELN FÜR "kategorie":
- Für todo wähle genau eine: "Haushalt & Reparatur", "Einkauf & Besorgungen", "Finanzen & Papierkram", "Freizeit & Familie", "Sonstiges"
- Für einkauf wähle genau eine: "Obst & Gemüse", "Kühlregal & Milch", "Drogerie & Haushalt", "Vorrat & Nudeln", "Bäckerei & Brot", "Fleisch & Fisch", "Tiefkühl", "Getränke", "Sonstiges"
- Für notiz: "Allgemein", "WLAN & Haus", "Wichtig"

REGELN FÜR "user":
- "Jonas", "Lena" oder "Beide" (Standard: "${defaultUser || "Beide"}")

Antworte NUR mit reinem JSON ohne Markdown-Codeblöcke:
{
  "type": "todo" | "einkauf" | "notiz",
  "text": "string",
  "user": "Jonas" | "Lena" | "Beide",
  "kategorie": "string",
  "datum": "YYYY-MM-DD" | ""
}`;

        const res = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: prompt,
          config: {
            responseMimeType: "application/json"
          }
        });

        const parsed = JSON.parse(res.text || "{}");
        if (parsed.text) return NextResponse.json(parsed);
      } catch (aiErr) {
        console.warn("KI Fehler:", aiErr);
      }
    }

    // Robuste Fallback-Bereinigung ohne API
    const cleaned = input
      .replace(/^(jonas|lena|wir|bitte)\s+(soll|sollen|muss|müssen|kann)?\s*(sich)?\s*/i, "")
      .replace(/^(heute|morgen|übermorgen)\s*(noch)?\s*/i, "")
      .replace(/^gedanken\s+(um|über)\s*(ein)?\s*/i, "Geschenk für ")
      .trim();

    return NextResponse.json({
      type: "todo",
      text: cleaned.charAt(0).toUpperCase() + cleaned.slice(1),
      user: defaultUser || "Beide",
      kategorie: "Freizeit & Familie",
      datum: ""
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
