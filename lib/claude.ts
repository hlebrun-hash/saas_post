import Anthropic from "@anthropic-ai/sdk";
import { Network, getNetworkPromptFragment } from "./networkConstraints";
import type { ArticleData, ProfileData } from "./scraper";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export interface GeneratedPost {
  title?: string; // Reddit only
  post: string;
  imagePrompt: string;
}

export async function generatePost(
  article: ArticleData,
  network: Network,
  userProfile: ProfileData
): Promise<GeneratedPost> {
  const networkFragment = getNetworkPromptFragment(network);

  const profileSection = [
    userProfile.bio && `Bio : ${userProfile.bio}`,
    userProfile.recentPosts.length &&
      `Posts récents :\n${userProfile.recentPosts.map((p) => `- ${p}`).join("\n")}`,
    userProfile.tone && `Ton détecté : ${userProfile.tone}`,
    userProfile.keywords.length &&
      `Mots-clés récurrents : ${userProfile.keywords.join(", ")}`,
  ]
    .filter(Boolean)
    .join("\n");

  const systemPrompt = `Tu es un expert en content marketing et copywriting pour les réseaux sociaux.
Tu crées des posts authentiques qui sonnent vraiment comme l'utilisateur, pas comme une IA.
Tu retournes UNIQUEMENT du JSON valide, sans markdown, sans commentaires.`;

  const userPrompt = `${networkFragment}

Profil de l'utilisateur :
${profileSection || "Aucun profil fourni — adopte un ton professionnel général."}

Article source :
Titre : ${article.title}
Description : ${article.description}
Contenu : ${article.content.slice(0, 4000)}
URL : ${article.url}

Instructions :
1. Génère un post qui sonne comme l'utilisateur (même vocabulaire, même ton).
2. Respecte les contraintes du réseau (longueur, style, hashtags).
3. Génère aussi un prompt d'image en anglais pour illustrer ce post (style photo réaliste ou illustration moderne).
4. Retourne UNIQUEMENT ce JSON (pas de markdown) :
${
  network === "reddit"
    ? `{
  "title": "Titre Reddit accrocheur",
  "post": "Corps du post Reddit",
  "imagePrompt": "Image prompt in English"
}`
    : `{
  "post": "Texte du post",
  "imagePrompt": "Image prompt in English"
}`
}`;

  const message = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    system: systemPrompt,
    messages: [{ role: "user", content: userPrompt }],
  });

  const raw =
    message.content[0].type === "text" ? message.content[0].text : "";

  // Strip potential markdown fences
  const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

  try {
    return JSON.parse(cleaned) as GeneratedPost;
  } catch {
    // Fallback: return raw text as post
    return {
      post: raw,
      imagePrompt:
        "A professional, modern illustration for a social media post",
    };
  }
}

export async function analyzeProfileTone(
  bio: string,
  recentPosts: string[]
): Promise<{ tone: string; keywords: string[] }> {
  const text = [bio, ...recentPosts].join("\n");

  const message = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 256,
    messages: [
      {
        role: "user",
        content: `Analyse ce profil et retourne UNIQUEMENT du JSON :
{
  "tone": "Un ou deux mots décrivant le ton (ex: Professionnel, Storytelling, Humoristique, Inspirant, Technique)",
  "keywords": ["mot1", "mot2", "mot3"]
}

Profil :
${text.slice(0, 2000)}`,
      },
    ],
  });

  const raw =
    message.content[0].type === "text" ? message.content[0].text : "{}";
  const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    return { tone: "Professionnel", keywords: [] };
  }
}
