import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // [id] is the answer_id — each answer has its own reply thread
    const { id: answerId } = await params;
    const { content, author_name } = await req.json();

    if (!content?.trim()) {
      return NextResponse.json({ error: "Content is required." }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("replies")
      .insert({
        answer_id: answerId,
        content: content.trim(),
        author_name: author_name?.trim() || null,
      })
      .select()
      .single();

    if (error) {
      console.error("❌ Reply POST Supabase error:", JSON.stringify(error, null, 2));
      return NextResponse.json({ error: error.message, details: error }, { status: 500 });
    }
    return NextResponse.json(data, { status: 201 });
  } catch (err: unknown) {
    console.error("❌ Reply POST unexpected error:", err);
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // [id] is the answer_id — fetch only replies for this specific answer
    const { id: answerId } = await params;

    const { data, error } = await supabase
      .from("replies")
      .select("id, content, author_name, created_at")
      .eq("answer_id", answerId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("❌ Reply GET Supabase error:", JSON.stringify(error, null, 2));
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(data ?? []);
  } catch (err: unknown) {
    console.error("❌ Reply GET unexpected error:", err);
    return NextResponse.json({ error: "Failed to fetch replies." }, { status: 500 });
  }
}
