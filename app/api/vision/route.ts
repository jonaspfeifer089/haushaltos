import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

export async function POST(request: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error("Vision API Error: GEMINI_API_KEY fehlt in den Umgebungsvariablen.");
      return NextResponse.json({ error: "API-Key fehlt auf dem Server" }, { status: 500 });
    }

    const { imageBase64 } = await request.json();
    if (!imageBase64) {
      return NextResponse.json({ error: "Kein Bild übergeben" }, { status: 400 });
    }

    const ai = new GoogleGenAI({ apiKey });

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          inlineData: {
            mimeType: "image/jpeg",
            data: imageBase64,
          },
        },
        "Analysiere dieses Bild eines Lebensmittelprodukts oder MHD-Aufklebers. Extrahiere den Namen des Artikels sowie das Mindesthaltbarkeitsdatum (MHD) im Format YYYY-MM-DD. Antworte AUSSCHLIESSLICH im JSON-Format ohne Markdown-Blöcke, exakt so: {\"artikel\": \"Name\", \"mhd\": \"YYYY-MM-DD\"}. Wenn du kein Datum findest, schätze ein realistisches Datum in der Zukunft ab.",
      ],
    });

    const textResult = response.text ? response.text.trim() : "{}";
    console.log("Gemini Roh-Antwort:", textResult);

    // Sauberes Entfernen von eventuellen Markdown-Wrappern
    const cleanJson = textResult.replace(/```json/g, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(cleanJson);

    return NextResponse.json({
      artikel: parsed.artikel || "Unbekannter Artikel",
      mhd: parsed.mhd || new Date().toISOString().split("T")[0],
    });
  } catch (error: any) {
    console.error("Vision Route Fehler:", error);
    return NextResponse.json({ error: error.message || "Fehler bei der KI-Analyse" }, { status: 500 });
  }
}