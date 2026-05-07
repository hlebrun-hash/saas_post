import { NextRequest, NextResponse } from "next/server";
import { scrapeArticle } from "@/lib/scraper";
import { z } from "zod";

const schema = z.object({ url: z.string().url() });

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { url } = schema.parse(body);
    const article = await scrapeArticle(url);
    return NextResponse.json(article);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur inconnue";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
