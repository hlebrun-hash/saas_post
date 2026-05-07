import { Mistral } from "@mistralai/mistralai";
import { Network, getNetworkPromptFragment } from "./networkConstraints";
import type { ArticleData, ProfileData } from "./scraper";

const client = new Mistral({ apiKey: process.env.MISTRAL_API_KEY });

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
RÈGLE ABSOLUE : aucun emoji dans le post généré. Zéro. Pas d'exception.
Tu retournes UNIQUEMENT du JSON valide, sans markdown, sans commentaires.`;

  const hookRules = network === "x"
    ? `HOOK (1ère ligne, ≤ 120 car.) : formule choc — question rhétorique, stat surprenante, affirmation provocatrice ou confession inattendue. Doit donner envie de lire la suite IMMÉDIATEMENT.`
    : network === "reddit"
    ? `HOOK (titre Reddit) : accroche directe qui promet de la valeur concrète ou crée de la curiosité. Évite le clickbait vide.`
    : `HOOK (1ère ou 2 premières lignes) : phrase d'accroche courte et percutante qui arrête le scroll. Peut être une question, un chiffre choc, une déclaration contre-intuitive ou une micro-histoire. Elle doit tenir seule, sans contexte.`;

  const userPrompt = `${networkFragment}

Profil de l'utilisateur :
${profileSection || "Aucun profil fourni — adopte un ton professionnel général."}

Article source :
Titre : ${article.title}
Description : ${article.description}
Contenu : ${article.content.slice(0, 4000)}
URL : ${article.url}

Instructions STRICTES :
1. ${hookRules}
2. Le reste du post développe l'idée du hook et apporte de la valeur.
3. Le post sonne comme l'utilisateur (même vocabulaire, même ton) — pas générique, pas IA.
4. Respecte les contraintes du réseau (longueur, style, hashtags).
5. Génère un prompt d'image en anglais pour illustrer ce post.
6. Retourne UNIQUEMENT ce JSON (pas de markdown) :
${
  network === "reddit"
    ? `{
  "title": "Titre Reddit — le hook",
  "post": "Corps du post Reddit",
  "imagePrompt": "Image prompt in English"
}`
    : `{
  "post": "Texte complet du post (hook en premier)",
  "imagePrompt": "Image prompt in English"
}`
}`;

  const response = await client.chat.complete({
    model: "mistral-large-latest",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
  });

  const raw = response.choices?.[0]?.message?.content ?? "";
  const text = typeof raw === "string" ? raw : "";
  const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

  try {
    return JSON.parse(cleaned) as GeneratedPost;
  } catch {
    return {
      post: text,
      imagePrompt: "A professional, modern illustration for a social media post",
    };
  }
}

export async function analyzeProfileTone(
  bio: string,
  recentPosts: string[],
  profileUrl?: string
): Promise<{ tone: string; keywords: string[] }> {
  const contentLines = [bio, ...recentPosts].filter(Boolean);
  const hasContent = contentLines.join("").trim().length > 10;

  // Build context: even with no scraped content, the URL tells Mistral a lot
  const urlContext = profileUrl
    ? `URL du profil analysé : ${profileUrl}\n`
    : "";

  const contentContext = hasContent
    ? `Contenu récupéré :\n${contentLines.join("\n").slice(0, 2000)}`
    : "Aucun contenu récupéré (profil privé ou réseau protégé). Infère le style probable à partir de l'URL et du réseau.";

  const response = await client.chat.complete({
    model: "mistral-small-latest",
    messages: [
      {
        role: "user",
        content: `Analyse ce profil de réseau social et retourne UNIQUEMENT du JSON.
${urlContext}${contentContext}

Retourne ce JSON (sans markdown) :
{
  "tone": "2-3 mots max décrivant le style d'écriture (ex: Professionnel & Direct, Storytelling Inspirant, Technique & Précis, Humoristique, Prise de position)",
  "keywords": ["mot-clé1", "mot-clé2", "mot-clé3"]
}`,
      },
    ],
  });

  const raw = response.choices?.[0]?.message?.content ?? "{}";
  const rawText = typeof raw === "string" ? raw : "{}";
  const cleaned = rawText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    return { tone: "Professionnel", keywords: [] };
  }
}
