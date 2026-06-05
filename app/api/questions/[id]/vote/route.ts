import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: questionId } = await params;
    const { voterId, direction } = await req.json();

    if (![1, -1].includes(direction)) {
      return NextResponse.json(
        { error: "invalid vote direction" },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("votes")
      .upsert(
        {
          question_id: questionId,
          voter_id: voterId,
          direction,
        },
        {
          onConflict: "question_id,voter_id",
        }
      );

    if (error) {
      console.error("Vote Error:", error);

      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}