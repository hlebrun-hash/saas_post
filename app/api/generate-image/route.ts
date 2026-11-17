import { NextRequest, NextResponse } from "next/server";
import { generateImage } from "@/lib/gemini";
import { z } from "zod";

const schema = z.object({ prompt: z.string().min(1) });

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { prompt } = schema.parse(body);
    const imageUrl = await generateImage(prompt);
    return NextResponse.json({ imageUrl });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur inconnue";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
