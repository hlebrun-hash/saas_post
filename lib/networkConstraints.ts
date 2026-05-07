export type Network = "linkedin" | "instagram" | "x" | "reddit";

export interface NetworkConstraint {
  label: string;
  maxChars: number;
  recommendedChars: number;
  style: string;
  extras: string;
  icon: string;
}

export const NETWORK_CONSTRAINTS: Record<Network, NetworkConstraint> = {
  linkedin: {
    label: "LinkedIn",
    maxChars: 3000,
    recommendedChars: 1300,
    style: "Professionnel, storytelling, inspirant",
    extras: "Emojis subtils, 3-5 hashtags max, saut de ligne après chaque idée",
    icon: "💼",
  },
  instagram: {
    label: "Instagram",
    maxChars: 2200,
    recommendedChars: 150,
    style: "Lifestyle, émotionnel, visuel",
    extras:
      "5-10 hashtags pertinents, appel à l'action, emoji pour rythmer le texte",
    icon: "📸",
  },
  x: {
    label: "X / Twitter",
    maxChars: 280,
    recommendedChars: 240,
    style: "Percutant, opinion tranchée, accroche forte",
    extras: "1-2 hashtags max, pas de remplissage, chaque mot compte",
    icon: "✦",
  },
  reddit: {
    label: "Reddit",
    maxChars: 40000,
    recommendedChars: 500,
    style: "Authentique, communautaire, informatif",
    extras:
      "Titre accrocheur obligatoire, pas de promotion directe, apporter de la valeur",
    icon: "🔴",
  },
};

export function getNetworkPromptFragment(network: Network): string {
  const c = NETWORK_CONSTRAINTS[network];
  return `
Réseau cible : ${c.label}
Longueur recommandée : ${c.recommendedChars} caractères (max ${c.maxChars})
Style : ${c.style}
Règles spécifiques : ${c.extras}
${network === "reddit" ? "Pour Reddit : génère un titre séparé dans le champ 'title' et le corps dans 'post'." : ""}
  `.trim();
}
