import { google } from "googleapis";

const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n")
  },
  scopes: ["https://www.googleapis.com/auth/spreadsheets"]
});

const sheets = google.sheets({ version: "v4", auth });
const SPREADSHEET_ID = "1Dj3_N9ybEhIDX5HukIELYtE2E3LToq4DiuPV3EBjOiA";

export async function getSheetData(range: string) {
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: range
    });
    return response.data.values || [];
  } catch (error) {
    console.error("Sheets Read Error:", error);
    return [];
  }
}

export async function appendSheetData(range: string, values: any[]) {
  try {
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: range,
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [values] }
    });
  } catch (error) {
    console.error("Sheets Write Error:", error);
  }
}
