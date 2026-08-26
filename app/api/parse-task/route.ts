import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

export async function POST(req: Request) {
  try {
    const { input, defaultUser } = await req.json();
    if (!input || !input.trim()) return NextResponse.json({ error: "Kein Text" }, { status: 400 });

    const apiKey = process.env.GEMINI_API_KEY;

    // Wenn API Key vorhanden ist -> echte KI-Analyse
    if (apiKey) {
      try {
        const ai = new GoogleGenAI({ apiKey });
        const prompt = `Extrahiere strukturierte Daten aus: "${input}"
Regeln:
1. "type": "todo" | "einkauf" | "notiz"
2. "text": Grammatikalisch saubere Formulierung im Infinitiv (z.B. aus "Jonas soll sich Gedanken machen um Geschenk für Mama" wird "Gedanken um Geschenk für Mama machen").
3. "user": "Jonas" | "Lena" | "Beide" (Fallback: "${defaultUser || "Beide"}")
4. "kategorie": "Haushalt & Reparatur" | "Einkauf & Besorgungen" | "Finanzen & Papierkram" | "Sonstiges"
5. "datum": YYYY-MM-DD oder leer.

JSON Schema:
{ "type": "todo", "text": "...", "user": "...", "kategorie": "...", "datum": "..." }`;

        const res = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: prompt,
          config: { responseMimeType: "application/json" }
        });

        const parsed = JSON.parse(res.text || "{}");
        if (parsed.text) return NextResponse.json(parsed);
      } catch (aiErr) {
        console.warn("KI Fallback aktiv:", aiErr);
      }
    }

    // Robuster Offline-/Fallback-Parser (verhindert leere To-Dos)
    const lower = input.toLowerCase();
    let user: "Jonas" | "Lena" | "Beide" = "Beide";
    if (lower.includes("jonas")) user = "Jonas";
    else if (lower.includes("lena")) user = "Lena";
    else if (defaultUser) user = defaultUser;

    let type: "todo" | "einkauf" | "notiz" = "todo";
    if (lower.match(/kauf|besorg|supermarkt|rewe|edeka|dm|apotheke/)) type = "einkauf";
    else if (lower.match(/notier|merke|pin|wlan/)) type = "notiz";

    // Text bereinigen, aber niemals leer lassen!
    let cleaned = input
      .replace(/^(jonas|lena|wir|bitte)\s+(soll|sollen|muss|müssen|kann)?\s*/i, "")
      .replace(/^(heute|morgen|übermorgen)\s*/i, "")
      .trim();

    if (!cleaned) cleaned = input;

    return NextResponse.json({
      type,
      text: cleaned.charAt(0).toUpperCase() + cleaned.slice(1),
      user,
      kategorie: type === "einkauf" ? "Sonstiges" : "Haushalt & Reparatur",
      datum: ""
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
