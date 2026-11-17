import https from "node:https";
import { Network, getNetworkPromptFragment } from "./networkConstraints";
import type { ArticleData, ProfileData } from "./scraper";

export interface GeneratedPost {
  title?: string; // Reddit only
  post: string;
  imagePrompt: string;
}

function getApiKey(): string {
  const key = process.env.GEMINI_API_KEY;
  if (!key || key.trim() === "") {
    throw new Error(
      "GEMINI_API_KEY est manquante dans les variables d'environnement. Assurez-vous de l'avoir ajoutée sur Vercel et d'avoir relancé le déploiement."
    );
  }
  return key.trim();
}

function requestGemini(
  model: string,
  payload: Record<string, unknown>
): Promise<string> {
  return new Promise((resolve, reject) => {
    const apiKey = getApiKey();
    const postData = JSON.stringify(payload);
    const options: https.RequestOptions = {
      hostname: "generativelanguage.googleapis.com",
      port: 443,
      path: `/v1beta/models/${model}:generateContent?key=${apiKey}`,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(postData),
      },
      timeout: 45000,
    };

    const req = https.request(options, (res) => {
      let responseBody = "";
      res.on("data", (chunk) => {
        responseBody += chunk;
      });
      res.on("end", () => {
        if (res.statusCode && (res.statusCode < 200 || res.statusCode >= 300)) {
          return reject(
            new Error(`Gemini API error (${res.statusCode}): ${responseBody}`)
          );
        }
        try {
          const json = JSON.parse(responseBody);
          const parts = json.candidates?.[0]?.content?.parts || [];
          const textPart =
            parts.find(
              (p: { text?: string; thought?: boolean }) => p.text && !p.thought
            ) || parts[parts.length - 1];
          resolve(textPart?.text ?? "");
        } catch (e: any) {
          reject(new Error(`Impossible d'analyser la réponse Gemini: ${e.message}`));
        }
      });
    });

    req.on("error", (err) => {
      reject(err);
    });

    req.on("timeout", () => {
      req.destroy(new Error("Gemini API request timed out (le serveur Google a mis plus de 45s à répondre)"));
    });

    req.write(postData);
    req.end();
  });
}

async function callGemini(
  systemInstruction: string,
  userPrompt: string,
  jsonMode: boolean = false
): Promise<string> {
  const body: Record<string, unknown> = {
    contents: [
      {
        role: "user",
        parts: [{ text: userPrompt }],
      },
    ],
  };

  if (systemInstruction) {
    body.systemInstruction = {
      parts: [{ text: systemInstruction }],
    };
  }

  if (jsonMode) {
    body.generationConfig = {
      responseMimeType: "application/json",
      temperature: 0.7,
      maxOutputTokens: 2048,
    };
  } else {
    body.generationConfig = {
      temperature: 0.7,
      maxOutputTokens: 2048,
    };
  }

  // Try gemini-3.5-flash-lite, fallback to gemini-flash-latest if needed
  try {
    return await requestGemini("gemini-3.5-flash-lite", body);
  } catch (err: any) {
    if (err.message && (err.message.includes("503") || err.message.includes("429"))) {
      return await requestGemini("gemini-flash-latest", body);
    }
    throw err;
  }
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
Tu retournes UNIQUEMENT du JSON valide, sans balises markdown autour.`;

  const hookRules =
    network === "x"
      ? `HOOK (1ère ligne, ≤ 120 car.) : formule choc — question rhétorique, stat surprenante, affirmation provocatrice ou confession inattendue. Doit donner envie de lire la suite IMMÉDIATEMENT.`
      : network === "reddit"
      ? `HOOK (titre Reddit) : accroche directe qui promet de la valeur concrète ou crée de la curiosité. Évite le clickbait vide.`
      : `HOOK (1ère ou 2 premières lignes) : phrase d'accroche courte et percutante qui arrête le scroll. Peut être une question, un chiffre choc, une déclaration contre-intuitive ou une micro-histoire. Elle doit tenir seule, sans contexte.`;

  const expectedJsonStructure =
    network === "reddit"
      ? `{"title": "Titre Reddit — le hook", "post": "Corps du post Reddit", "imagePrompt": "Image prompt in English"}`
      : `{"post": "Texte complet du post (hook en premier)", "imagePrompt": "Image prompt in English"}`;

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
6. Retourne UNIQUEMENT ce format JSON :
${expectedJsonStructure}`;

  const text = await callGemini(systemPrompt, userPrompt, true);
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

  const urlContext = profileUrl ? `URL du profil analysé : ${profileUrl}\n` : "";
  const contentContext = hasContent
    ? `Contenu récupéré :\n${contentLines.join("\n").slice(0, 2000)}`
    : "Aucun contenu récupéré (profil privé ou réseau protégé). Infère le style probable à partir de l'URL et du réseau.";

  const userPrompt = `Analyse ce profil de réseau social et retourne UNIQUEMENT du JSON.
${urlContext}${contentContext}

Retourne ce format JSON :
{
  "tone": "2-3 mots max décrivant le style d'écriture (ex: Professionnel & Direct, Storytelling Inspirant, Technique & Précis, Humoristique, Prise de position)",
  "keywords": ["mot-clé1", "mot-clé2", "mot-clé3"]
}`;

  try {
    const text = await callGemini(
      "Tu es un analyste de style éditorial. Retourne toujours du JSON valide.",
      userPrompt,
      true
    );
    const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    return JSON.parse(cleaned);
  } catch {
    return { tone: "Professionnel & Direct", keywords: ["business", "stratégie"] };
  }
}

export async function generateImage(prompt: string): Promise<string> {
  const encodedPrompt = encodeURIComponent(
    `${prompt}, high quality, professional, modern, clean aesthetic, warm terracotta minimalist`
  );
  return `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1080&height=1080&nologo=true`;
}
