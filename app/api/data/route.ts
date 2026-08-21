import { NextResponse } from "next/server";
import { google } from "googleapis";

export async function GET() {
  try {
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      },
      scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
    });

    const sheets = google.sheets({ version: "v4", auth });
    const spreadsheetId = "1Dj3_N9ybEhIDX5HukIELYtE2E3LToq4DiuPV3EBjOiA"; // Deine Tabellen-ID

    // Wir holen die Daten aus den Blättern (z.B. Einkauf, Vorrat, Haushalt)
    const einkaufRes = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: "Einkauf!A:B",
    });

    const vorratRes = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: "Vorrat!A:C",
    });

    return NextResponse.json({
      einkauf: einkaufRes.data.values || [],
      vorrat: vorratRes.data.values || [],
    });
  } catch (error) {
    console.error("Sheets API Error:", error);
    return NextResponse.json({ error: "Fehler beim Laden der Google Sheets Daten" }, { status: 500 });
  }
}