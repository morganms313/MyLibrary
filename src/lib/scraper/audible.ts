import * as cheerio from "cheerio";
import type { ScrapedBookData } from "./types";

export async function scrapeAudible(url: string): Promise<ScrapedBookData> {
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9",
    },
    redirect: "follow",
  });
  const html = await res.text();
  const $ = cheerio.load(html);

  // --- Try JSON-LD structured data embedded in page ---
  let jsonAuthor: string | null = null;
  let jsonNarrator: string | null = null;

  // Audible embeds author in a JSON-like structure: "author": [{"name": "..."}]
  const authorJsonMatch = html.match(
    /"author"\s*:\s*\[\s*\{[^}]*?"name"\s*:\s*"([^"]+)"/
  );
  if (authorJsonMatch) jsonAuthor = authorJsonMatch[1];

  const narratorJsonMatch = html.match(
    /"readBy"[^}]*?"name"\s*:\s*"([^"]+)"/
  );
  if (narratorJsonMatch) jsonNarrator = narratorJsonMatch[1];

  // --- Title ---
  const title =
    $("h1").first().text().trim() ||
    $('meta[property="og:title"]').attr("content") ||
    null;

  // --- Author ---
  const author = jsonAuthor || null;

  // --- Cover ---
  let coverUrl =
    $("img.bc-pub-block").first().attr("src") ||
    $('img[class*="cover"]').first().attr("src") ||
    $('meta[property="og:image"]').attr("content") ||
    null;

  // Clean up Audible OG images (they add social sharing overlays)
  if (coverUrl && coverUrl.includes("PJAdblSocialShare")) {
    // Try to extract the base image URL
    const cleanMatch = coverUrl.match(/(https:\/\/m\.media-amazon\.com\/images\/I\/[^.]+)\./);
    if (cleanMatch) {
      coverUrl = cleanMatch[1] + ".jpg";
    }
  }

  // --- Description ---
  const description =
    $('meta[property="og:description"]')
      .attr("content")
      ?.replace(/^Check out this great listen on Audible\.com\.\s*/i, "")
      ?.substring(0, 1000) ||
    $('meta[name="description"]')
      .attr("content")
      ?.substring(0, 1000) ||
    null;

  return {
    title,
    author,
    coverUrl,
    description,
    isbn: null,
    pageCount: null,
    narrator: jsonNarrator,
    durationMinutes: (() => {
      const isoMatch = html.match(/PT(\d+)H(\d+)M/);
      if (isoMatch) return parseInt(isoMatch[1]) * 60 + parseInt(isoMatch[2]);
      const textMatch = html.match(
        /(\d{1,2})\s*(?:hours?|hrs?)\s*(?:and|&)?\s*(\d{1,2})\s*(?:minutes?|mins?)/i
      );
      if (textMatch) return parseInt(textMatch[1]) * 60 + parseInt(textMatch[2]);
      return null;
    })(),
    seriesName: null,
    seriesNumber: null,
    seriesTotalBooks: null,
    sourceUrl: url,
  };
}
