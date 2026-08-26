import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function POST(req: Request) {
  try {
    const { input, defaultUser } = await req.json();
    if (!input) return NextResponse.json({ error: "Kein Text übergeben" }, { status: 400 });

    const prompt = `Du bist ein intelligenter Assistent für ein Haushalts-Dashboard von Jonas und Lena.
Analysiere den folgenden gesprochenen Satz und extrahiere strukturierte JSON-Daten:
Satz: "${input}"

Regeln:
1. "type": Entweder "todo", "einkauf" oder "notiz".
   - "einkauf" wenn Lebensmittel/Produkte besorgt werden sollen (z.B. "Kauf Hafermilch", "Wir brauchen Eier").
   - "notiz" wenn es eine Information, Idee, Code oder Notiz ist (z.B. "WLAN Passwort ist 1234", "Idee für Urlaub").
   - "todo" für Aufgaben, Erledigungen, Haushaltsarbeiten.
2. "text": Formuliere den eigentlichen Inhalt grammatikalisch sauber, präzise und leserlich im Infinitiv oder als klares Substantiv (z.B. aus "Jonas soll sich heute gedanken machen um Geschenk für Mama" wird "Gedanken um Geschenk für Mama machen", aus "kauf bitte eier und milch" wird "Eier und Milch").
3. "user": "Jonas", "Lena" oder "Beide". Wenn niemand genannt wird, nutze "${defaultUser || "Beide"}".
4. "kategorie": 
   - Für todo: "Haushalt & Reparatur", "Einkauf & Besorgungen", "Finanzen & Papierkram" oder "Sonstiges".
   - Für einkauf: Passende Kategorie (z.B. "Obst & Gemüse", "Kühlregal & Milch", "Drogerie & Haushalt", "Vorrat & Nudeln", "Bäckerei & Brot", "Getränke", "Sonstiges").
   - Für notiz: "Allgemein", "WLAN & Haus" oder "Wichtig".
5. "datum": Falls ein Datum genannt wird (heute, morgen, übermorgen, Wochentag), berechne das Datum relativ zu heute (${new Date().toISOString().split("T")[0]}). Sonst leer lassen.

Antworte NUR mit reinem JSON ohne Markdown-Codeblöcke:
{
  "type": "todo" | "einkauf" | "notiz",
  "text": "string",
  "user": "Jonas" | "Lena" | "Beide",
  "kategorie": "string",
  "datum": "YYYY-MM-DD" | ""
}`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    const jsonText = response.text || "{}";
    const parsed = JSON.parse(jsonText);

    return NextResponse.json(parsed);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Fehler beim Parsen" }, { status: 500 });
  }
}
