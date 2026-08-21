import { NextResponse } from "next/server";
import { google } from "googleapis";

const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  },
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

const sheets = google.sheets({ version: "v4", auth });
const spreadsheetId = "1Dj3_N9ybEhIDX5HukIELYtE2E3LToq4DiuPV3EBjOiA";

// 1. Daten lesen (GET)
export async function GET() {
  try {
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
    return NextResponse.json({ error: "Fehler beim Lesen" }, { status: 500 });
  }
}

// 2. Daten schreiben (POST)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { sheetName, values } = body; // z.B. sheetName = "Einkauf", values = ["Milch"]

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `${sheetName}!A:B`,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [values],
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Sheets Write Error:", error);
    return NextResponse.json({ error: "Fehler beim Schreiben" }, { status: 500 });
  }
}