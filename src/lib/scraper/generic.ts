import * as cheerio from "cheerio";
import type { ScrapedBookData } from "./types";

export async function scrapeGeneric(url: string): Promise<ScrapedBookData> {
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    },
  });
  const html = await res.text();
  const $ = cheerio.load(html);

  let title: string | null = null;
  let author: string | null = null;
  let coverUrl: string | null = null;
  let description: string | null = null;
  let isbn: string | null = null;
  let pageCount: number | null = null;

  // Try JSON-LD first
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const data = JSON.parse($(el).html() || "");
      const book =
        data["@type"] === "Book"
          ? data
          : Array.isArray(data["@graph"])
            ? data["@graph"].find(
                (item: { "@type": string }) => item["@type"] === "Book"
              )
            : null;

      if (book) {
        title = title || book.name || null;
        author =
          author ||
          (typeof book.author === "string"
            ? book.author
            : book.author?.name) ||
          null;
        coverUrl = coverUrl || book.image || null;
        description =
          description || book.description?.substring(0, 1000) || null;
        isbn = isbn || book.isbn || null;
        if (book.numberOfPages)
          pageCount = pageCount || parseInt(book.numberOfPages);
      }
    } catch {
      // ignore
    }
  });

  // Open Graph fallback
  title = title || $('meta[property="og:title"]').attr("content") || null;
  coverUrl =
    coverUrl || $('meta[property="og:image"]').attr("content") || null;
  description =
    description ||
    $('meta[property="og:description"]').attr("content")?.substring(0, 1000) ||
    null;

  // Standard meta fallback
  author = author || $('meta[name="author"]').attr("content") || null;
  description =
    description ||
    $('meta[name="description"]').attr("content")?.substring(0, 1000) ||
    null;

  // Last resort: HTML title
  title = title || $("title").text().trim() || null;

  return { title, author, coverUrl, description, isbn, pageCount, narrator: null, durationMinutes: null, seriesName: null, seriesNumber: null, seriesTotalBooks: null, sourceUrl: url };
}
