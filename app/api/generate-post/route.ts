import { NextRequest, NextResponse } from "next/server";
import { generatePost } from "@/lib/gemini";
import { z } from "zod";

export const maxDuration = 60;

const schema = z.object({
  article: z.object({
    title: z.string(),
    content: z.string(),
    description: z.string(),
    image: z.string().nullable(),
    url: z.string(),
  }),
  network: z.enum(["linkedin", "instagram", "x", "reddit"]),
  userProfile: z.object({
    bio: z.string(),
    recentPosts: z.array(z.string()),
    tone: z.string(),
    keywords: z.array(z.string()),
    manual: z.boolean(),
  }),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { article, network, userProfile } = schema.parse(body);
    const result = await generatePost(article, network, userProfile);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur inconnue";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
