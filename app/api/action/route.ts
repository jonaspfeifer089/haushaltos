import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: Request) {
  try {
    const { type, id, action } = await req.json();

    if (action === "erledigt") {
      if (type === "todo") {
        await supabase.from("todos").update({ status: "Erledigt" }).eq("id", id);
      } else if (type === "einkauf") {
        await supabase.from("einkauf").update({ status: "Erledigt" }).eq("id", id);
      }
      return NextResponse.json({ success: true, message: "Als erledigt markiert!" });
    }

    return NextResponse.json({ error: "Unbekannte Aktion" }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: "Serverfehler" }, { status: 500 });
  }
}
