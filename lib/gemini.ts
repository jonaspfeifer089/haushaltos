export async function analyzeImageWithGemini(base64Image: string) {
  const apiKey = process.env.GEMINI_API_KEY;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            {
              text: 'Analysiere dieses Foto von einem Lebensmittelprodukt. Finde den Namen des Produkts und das Verfallsdatum (MHD) im Format YYYY-MM-DD. Antworte AUSSCHLIESSLICH im JSON-Format: {"produkt": "...", "mhd": "..."}'
            },
            { inline_data: { mime_type: "image/jpeg", data: base64Image } }
          ]
        }
      ]
    })
  });

  const data = await response.json();
  const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
  const cleanedText = rawText
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();
  return JSON.parse(cleanedText);
}
