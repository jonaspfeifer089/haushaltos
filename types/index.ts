export interface Departure {
  line: string;
  destination: string;
  time: string;
}
export interface CalendarEvent {
  title: string;
  date: string;
  type?: "termin" | "putz";
}
export interface TodoItem {
  id: string;
  aufgabe: string;
  kategorie: string;
  status: string;
  zustaendig: string;
}
export interface EinkaufItem {
  id: string;
  artikel: string;
  status: string;
  kategorie?: string;
  fuer?: string;
}
export interface GymItem {
  id: string;
  datum: string;
  uebung: string;
  gewicht: number;
  reps: number;
  setnum: number;
  username: string;
}
export interface PutzItem {
  id: string;
  aufgabe: string;
  letztes_datum: string;
  intervall: string;
  username: string;
}
export interface VorratItem {
  id: string;
  artikel: string;
  ablaufdatum: string;
  anbruch: string;
}
export interface CountdownItem {
  id: string;
  title: string;
  date: string;
  icon: string;
}
export interface NoteItem {
  id: string;
  title: string;
  content: string;
  category: string;
  color: string;
}

export const EINKAUF_KATEGORIEN = [
  "Obst & Gemüse",
  "Kühlregal",
  "Vorrat & Teigwaren",
  "Getränke",
  "Drogerie & Haushalt",
  "Sonstiges"
] as const;
export const TODO_KATEGORIEN = [
  "Haushalt & Reparatur",
  "Bürokratie & Verträge",
  "Besorgungen",
  "Freizeit & Projekte",
  "Sonstiges"
] as const;
export const SCHNELLWAHL_FAVORITEN = [
  "Hafermilch",
  "Bananen",
  "Eier",
  "Körniger Frischkäse",
  "Toast",
  "Äpfel",
  "Spüli",
  "Mineralwasser"
];

export const PUSH_ROUTINE = [
  "Bankdrücken (Langhantel)",
  "Schrägbankdrücken (Kurzhantel)",
  "Tiefe Cable crossovers",
  "Schulterpresse sitzend (Maschine)",
  "Seitheben (Kurzhantel)",
  "Trizepsdrücken mit dem Seil",
  "Überkopf-Trizepsstrecken (Kabelzug)",
  "Einarmiges Seitheben (Kabelzug)"
];
export const PULL_ROUTINE = [
  "Sitzendes Rudern am Kabelzug - V-Griff (Kabel)",
  "Latzug (Kabel)",
  "Incline Curl sitzend (Kurzhantel)",
  "Hammer Curl (Kurzhantel)",
  "Preacher Curl (Langhantel)"
];
export const CORE_COMPOUNDS = [
  { name: "Bankdrücken (Langhantel)", group: "Brust" },
  { name: "Schrägbankdrücken (Kurzhantel)", group: "Brust" },
  { name: "Sitzendes Rudern am Kabelzug - V-Griff (Kabel)", group: "Rücken" },
  { name: "Latzug (Kabel)", group: "Rücken" },
  { name: "Schulterpresse sitzend (Maschine)", group: "Schulter" }
];
