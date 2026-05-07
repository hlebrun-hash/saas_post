import * as cheerio from "cheerio";

export interface ArticleData {
  title: string;
  content: string;
  description: string;
  image: string | null;
  url: string;
}

export interface ProfileData {
  bio: string;
  recentPosts: string[];
  tone: string;
  keywords: string[];
  manual: boolean;
}

const DESKTOP_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";
const MOBILE_UA =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1";

export async function scrapeArticle(url: string): Promise<ArticleData> {
  const res = await fetch(url, {
    headers: { "User-Agent": DESKTOP_UA },
    signal: AbortSignal.timeout(15000),
  });

  if (!res.ok) throw new Error(`HTTP ${res.status} pour ${url}`);

  const html = await res.text();
  const $ = cheerio.load(html);

  const title =
    $('meta[property="og:title"]').attr("content") ||
    $("title").text() ||
    $("h1").first().text() ||
    "";

  const description =
    $('meta[property="og:description"]').attr("content") ||
    $('meta[name="description"]').attr("content") ||
    "";

  const image =
    $('meta[property="og:image"]').attr("content") ||
    $('meta[name="twitter:image"]').attr("content") ||
    null;

  $(
    "script, style, nav, header, footer, aside, .ad, .advertisement, .sidebar, .menu, .navigation, iframe, noscript"
  ).remove();

  const articleEl =
    $("article").first() ||
    $('[role="main"]').first() ||
    $("main").first();

  let content = "";
  if (articleEl.length) {
    content = articleEl.text();
  } else {
    let maxLen = 0;
    $("div, section").each((_, el) => {
      const t = $(el).text().trim();
      if (t.length > maxLen) {
        maxLen = t.length;
        content = t;
      }
    });
  }

  content = content.replace(/\s+/g, " ").trim().slice(0, 8000);

  return {
    title: title.trim(),
    content,
    description: description.trim(),
    image,
    url,
  };
}

// ── Platform-specific scrapers ────────────────────────────────────────────

async function scrapeReddit(profileUrl: string): Promise<{ bio: string; recentPosts: string[] }> {
  // Extract username from URL: reddit.com/user/username or reddit.com/u/username
  const match = profileUrl.match(/reddit\.com\/(?:user|u)\/([^/?#]+)/i);
  if (!match) throw new Error("URL Reddit invalide");
  const username = match[1];

  const [aboutRes, postsRes] = await Promise.allSettled([
    fetch(`https://www.reddit.com/user/${username}/about.json`, {
      headers: { "User-Agent": "article-to-post/1.0 (social content tool)" },
      signal: AbortSignal.timeout(8000),
    }),
    fetch(`https://www.reddit.com/user/${username}/submitted.json?limit=5`, {
      headers: { "User-Agent": "article-to-post/1.0 (social content tool)" },
      signal: AbortSignal.timeout(8000),
    }),
  ]);

  let bio = "";
  const recentPosts: string[] = [];

  if (aboutRes.status === "fulfilled" && aboutRes.value.ok) {
    const data = await aboutRes.value.json() as { data?: { subreddit?: { public_description?: string }; icon_img?: string } };
    bio = data?.data?.subreddit?.public_description || "";
  }

  if (postsRes.status === "fulfilled" && postsRes.value.ok) {
    const data = await postsRes.value.json() as { data?: { children?: Array<{ data: { title: string; selftext?: string } }> } };
    for (const child of data?.data?.children || []) {
      const t = child.data.title;
      const body = child.data.selftext || "";
      recentPosts.push(body ? `${t}\n${body}`.slice(0, 400) : t);
    }
  }

  return { bio, recentPosts };
}

async function scrapeX(profileUrl: string): Promise<{ bio: string; recentPosts: string[] }> {
  // Try several Nitter instances as X blocks scraping
  const match = profileUrl.match(/(?:twitter|x)\.com\/([^/?#]+)/i);
  if (!match) throw new Error("URL X/Twitter invalide");
  const username = match[1];

  const nitterInstances = [
    `https://nitter.poast.org/${username}`,
    `https://nitter.privacydev.net/${username}`,
    `https://nitter.net/${username}`,
  ];

  for (const nitterUrl of nitterInstances) {
    try {
      const res = await fetch(nitterUrl, {
        headers: { "User-Agent": DESKTOP_UA, Accept: "text/html" },
        signal: AbortSignal.timeout(6000),
      });
      if (!res.ok) continue;

      const html = await res.text();
      const $ = cheerio.load(html);

      const bio = $(".profile-bio").text().trim() ||
        $('meta[property="og:description"]').attr("content") || "";

      const recentPosts: string[] = [];
      $(".tweet-content, .timeline-item .content").each((_, el) => {
        const t = $(el).text().trim();
        if (t.length > 10) recentPosts.push(t.slice(0, 280));
      });

      if (bio || recentPosts.length > 0) {
        return { bio, recentPosts: recentPosts.slice(0, 5) };
      }
    } catch {
      continue;
    }
  }

  throw new Error("Impossible de lire le profil X via Nitter");
}

async function scrapeGeneric(profileUrl: string): Promise<{ bio: string; recentPosts: string[] }> {
  const attempts: Array<Record<string, string>> = [
    { "User-Agent": MOBILE_UA, "Accept": "text/html", "Accept-Language": "fr-FR,fr;q=0.9" },
    { "User-Agent": DESKTOP_UA, "Accept": "text/html" },
  ];

  for (const headers of attempts) {
    try {
      const res = await fetch(profileUrl, {
        headers,
        signal: AbortSignal.timeout(8000),
        redirect: "follow",
      });

      const html = await res.text();
      const $ = cheerio.load(html);

      const bio =
        $('meta[property="og:description"]').attr("content") ||
        $('meta[name="description"]').attr("content") ||
        $('meta[name="twitter:description"]').attr("content") ||
        $('[class*="bio"], [class*="about"], [class*="description"], [class*="headline"]')
          .first().text().trim() ||
        "";

      const recentPosts: string[] = [];
      $("p, [class*='post'], [class*='tweet'], [class*='update']").each((_, el) => {
        const t = $(el).text().trim();
        if (t.length > 30 && t.length < 600) recentPosts.push(t);
      });

      if (bio.length > 20 || recentPosts.length > 0) {
        return { bio: bio.slice(0, 600), recentPosts: recentPosts.slice(0, 5) };
      }
    } catch {
      continue;
    }
  }

  return { bio: "", recentPosts: [] };
}

// ── Main export ──────────────────────────────────────────────────────────

export async function scrapeProfile(
  profileUrl: string,
  network: string
): Promise<{ bio: string; recentPosts: string[] }> {
  switch (network) {
    case "reddit":
      return scrapeReddit(profileUrl);
    case "x":
      return scrapeX(profileUrl);
    default:
      return scrapeGeneric(profileUrl);
  }
}
