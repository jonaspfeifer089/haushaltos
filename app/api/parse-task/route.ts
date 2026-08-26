import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { input, defaultUser } = await req.json();
    if (!input) return NextResponse.json({ error: "Kein Text übergeben" }, { status: 400 });

    const text = input.toLowerCase();

    // 1. Zuweisung erkennen
    let zustaendig: "Jonas" | "Lena" | "Beide" = "Beide";
    if (text.includes("jonas")) zustaendig = "Jonas";
    else if (text.includes("lena")) zustaendig = "Lena";
    else if (defaultUser) zustaendig = defaultUser;

    // 2. Kategorie erkennen
    let kategorie = "Haushalt & Reparatur";
    if (text.match(/kauf|besorg|supermarkt|drogerie|rewe|edeka|dm/))
      kategorie = "Einkauf & Besorgungen";
    else if (text.match(/arzt|termin|bank|überweis|anruf|mail/))
      kategorie = "Finanzen & Papierkram";
    else if (text.match(/putz|wisch|saugen|müll|wasch|bad|küche/))
      kategorie = "Haushalt & Reparatur";

    // 3. Zeit / Datum erkennen
    const today = new Date();
    let targetDate = today.toISOString().split("T")[0];

    if (text.includes("morgen")) {
      const tomorrow = new Date();
      tomorrow.setDate(today.getDate() + 1);
      targetDate = tomorrow.toISOString().split("T")[0];
    } else if (text.includes("übermorgen")) {
      const dayAfter = new Date();
      dayAfter.setDate(today.getDate() + 2);
      targetDate = dayAfter.toISOString().split("T")[0];
    }

    // 4. Bereinigter Aufgabentext
    const cleanTask = input
      .replace(/(bitte|soll|musst|muss|heute|morgen|übermorgen|jonas|lena|um \d+ Uhr)/gi, "")
      .replace(/\s+/g, " ")
      .trim();

    return NextResponse.json({
      aufgabe: cleanTask || input,
      kategorie,
      zustaendig,
      datum: targetDate
    });
  } catch {
    return NextResponse.json({ error: "Fehler beim Parsen" }, { status: 500 });
  }
}
