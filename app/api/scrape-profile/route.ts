import { NextRequest, NextResponse } from "next/server";
import { scrapeProfile } from "@/lib/scraper";
import { analyzeProfileTone } from "@/lib/gemini";
import { z } from "zod";

export const maxDuration = 60;

const schema = z.object({
  profileUrl: z.string().url(),
  network: z.enum(["linkedin", "instagram", "x", "reddit"]),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { profileUrl, network } = schema.parse(body);

    // Try scraping — never throws to the user, always falls back gracefully
    let bio = "";
    let recentPosts: string[] = [];

    try {
      const scraped = await scrapeProfile(profileUrl, network);
      bio = scraped.bio;
      recentPosts = scraped.recentPosts;
    } catch {
      // Scraping failed (private profile, bot block, etc.)
      // Mistral will infer style from the URL alone
    }

    // Always call Mistral — even with no content, the URL is enough context
    const { tone, keywords } = await analyzeProfileTone(bio, recentPosts, profileUrl);

    return NextResponse.json({
      bio,
      recentPosts,
      tone,
      keywords,
      manual: false,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur inconnue";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
