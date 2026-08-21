import { NextResponse } from "next/server";
import { google } from "googleapis";

const getAuth = () => new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  },
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

const spreadsheetId = "1Dj3_N9ybEhIDX5HukIELYtE2E3LToq4DiuPV3EBjOiA";

export async function GET() {
  try {
    const sheets = google.sheets({ version: "v4", auth: getAuth() });
    const haushaltRes = await sheets.spreadsheets.values.get({ spreadsheetId, range: "Haushalt!A:D" });
    const einkaufRes = await sheets.spreadsheets.values.get({ spreadsheetId, range: "Einkauf!A:B" });
    const vorratRes = await sheets.spreadsheets.values.get({ spreadsheetId, range: "Vorrat!A:C" });

    return NextResponse.json({
      haushalt: haushaltRes.data.values || [],
      einkauf: einkaufRes.data.values || [],
      vorrat: vorratRes.data.values || [],
    });
  } catch (error) {
    return NextResponse.json({ error: "Fehler beim Lesen der Sheets" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { sheetName, values } = await request.json();
    const sheets = google.sheets({ version: "v4", auth: getAuth() });
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `${sheetName}!A:D`,
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [values] },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Fehler beim Schreiben" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { sheetName, rowIndex, values } = await request.json();
    const sheets = google.sheets({ version: "v4", auth: getAuth() });
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${sheetName}!A${rowIndex}`,
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [values] },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Fehler beim Updaten" }, { status: 500 });
  }
}