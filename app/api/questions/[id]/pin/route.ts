import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: questionId } = await params;
  const { pinned } = await req.json();

  if (typeof pinned !== "boolean") {
    return NextResponse.json({ error: "Pinned must be a boolean." }, { status: 400 });
  }

  const { error } = await supabase
    .from("questions")
    .update({ pinned })
    .eq("id", questionId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
