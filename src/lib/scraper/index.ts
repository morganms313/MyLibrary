import type { ScrapedBookData } from "./types";
import { scrapeAmazon } from "./amazon";
import { scrapeGoodreads } from "./goodreads";
import { scrapeGoogleBooks } from "./google-books";
import { scrapeAudible } from "./audible";
import { scrapeGeneric } from "./generic";

export type { ScrapedBookData };

const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
};

async function resolveUrl(url: string): Promise<string> {
  // Follow redirects to get the final URL (handles a.co, amzn.to, bit.ly, etc.)
  try {
    const res = await fetch(url, { headers: HEADERS, redirect: "follow" });
    return res.url;
  } catch {
    return url;
  }
}

export async function scrapeBookFromUrl(
  url: string
): Promise<ScrapedBookData> {
  // Resolve short URLs first
  const hostname = new URL(url).hostname.toLowerCase();
  const isShortUrl =
    hostname === "a.co" ||
    hostname === "amzn.to" ||
    hostname === "amzn.com" ||
    hostname === "bit.ly" ||
    hostname === "goo.gl" ||
    url.length < 40;

  const resolvedUrl = isShortUrl ? await resolveUrl(url) : url;
  const resolvedHost = new URL(resolvedUrl).hostname.toLowerCase();

  if (
    resolvedHost.includes("amazon.com") ||
    resolvedHost.includes("amazon.co")
  ) {
    return scrapeAmazon(resolvedUrl);
  }

  if (resolvedHost.includes("audible.com") || resolvedHost.includes("audible.co")) {
    return scrapeAudible(resolvedUrl);
  }

  if (resolvedHost.includes("goodreads.com")) {
    return scrapeGoodreads(resolvedUrl);
  }

  if (resolvedHost.includes("google.com") && resolvedUrl.includes("/books")) {
    return scrapeGoogleBooks(resolvedUrl);
  }

  return scrapeGeneric(resolvedUrl);
}
