import { NextResponse } from "next/server";
import { google } from "googleapis";

const getAuth = () =>
  new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    },
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

const spreadsheetId = "1Dj3_N9ybEhIDX5HukIELYtE2E3LToq4DiuPV3EBjOiA";

// 1. GET: Alle Daten auf einen Schlag abrufen
export async function GET() {
  try {
    const sheets = google.sheets({ version: "v4", auth: getAuth() });

    const [haushaltRes, einkaufRes, vorratRes, countdownsRes, notizenRes, todosRes, gymRes] =
      await Promise.all([
        sheets.spreadsheets.values.get({ spreadsheetId, range: "Haushalt!A:D" }).catch(() => ({ data: { values: [] } })),
        sheets.spreadsheets.values.get({ spreadsheetId, range: "Einkauf!A:B" }).catch(() => ({ data: { values: [] } })),
        sheets.spreadsheets.values.get({ spreadsheetId, range: "Vorrat!A:C" }).catch(() => ({ data: { values: [] } })),
        sheets.spreadsheets.values.get({ spreadsheetId, range: "Countdowns!A:C" }).catch(() => ({ data: { values: [] } })),
        sheets.spreadsheets.values.get({ spreadsheetId, range: "Notizen!A:D" }).catch(() => ({ data: { values: [] } })),
        sheets.spreadsheets.values.get({ spreadsheetId, range: "Todos!A:D" }).catch(() => ({ data: { values: [] } })),
        sheets.spreadsheets.values.get({ spreadsheetId, range: "Gym!A:F" }).catch(() => ({ data: { values: [] } })),
      ]);

    return NextResponse.json({
      haushalt: haushaltRes.data.values || [],
      einkauf: einkaufRes.data.values || [],
      vorrat: vorratRes.data.values || [],
      countdowns: countdownsRes.data.values || [],
      notizen: notizenRes.data.values || [],
      todos: todosRes.data.values || [],
      gym: gymRes.data.values || [],
    });
  } catch (error: any) {
    console.error("Sheets GET Error:", error);
    return NextResponse.json({ error: "Fehler beim Lesen der Sheets", details: error.message }, { status: 500 });
  }
}

// 2. POST: Neuen Eintrag unten anfügen
export async function POST(request: Request) {
  try {
    const { sheetName, values } = await request.json();
    const sheets = google.sheets({ version: "v4", auth: getAuth() });

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: sheetName, // Dynamisch: Passt sich automatisch an die Spaltenanzahl an
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [values] },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Sheets POST Error:", error);
    return NextResponse.json({ error: "Fehler beim Schreiben", details: error.message }, { status: 500 });
  }
}

// 3. PUT: Bestehende Zeile aktualisieren (Status ändern, Datum updaten, Leeren)
export async function PUT(request: Request) {
  try {
    const { sheetName, rowIndex, values } = await request.json();
    const sheets = google.sheets({ version: "v4", auth: getAuth() });

    // Dynamische End-Spalte berechnen (1 Wert = A, 2 = B, 4 = D, 6 = F)
    const endColumn = String.fromCharCode(64 + values.length);

    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${sheetName}!A${rowIndex}:${endColumn}${rowIndex}`,
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [values] },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Sheets PUT Error:", error);
    return NextResponse.json({ error: "Fehler beim Updaten", details: error.message }, { status: 500 });
  }
}