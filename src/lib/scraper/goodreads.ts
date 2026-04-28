import * as cheerio from "cheerio";
import type { ScrapedBookData } from "./types";

export async function scrapeGoodreads(url: string): Promise<ScrapedBookData> {
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    },
  });
  const html = await res.text();
  const $ = cheerio.load(html);

  const title =
    $('h1[data-testid="bookTitle"]').text().trim() ||
    $("h1.Text__title1").text().trim() ||
    $('meta[property="og:title"]').attr("content") ||
    null;

  const author =
    $("span.ContributorLink__name").first().text().trim() ||
    $(".authorName span[itemprop='name']").first().text().trim() ||
    $('meta[property="books:author"]').attr("content") ||
    null;

  const coverUrl =
    $(".BookCover img, .BookPage__bookCover img").attr("src") ||
    $('meta[property="og:image"]').attr("content") ||
    null;

  const description =
    $(".BookPageMetadataSection__description span.Formatted")
      .text()
      .trim()
      .substring(0, 1000) ||
    $('meta[property="og:description"]').attr("content")?.substring(0, 1000) ||
    null;

  let pageCount: number | null = null;
  const pagesText = $('p[data-testid="pagesFormat"]').text();
  const pagesMatch = pagesText.match(/(\d+)\s*pages/);
  if (pagesMatch) pageCount = parseInt(pagesMatch[1]);

  let isbn: string | null = null;
  const isbnMeta = $('meta[property="books:isbn"]').attr("content");
  if (isbnMeta) isbn = isbnMeta;

  // Try JSON-LD
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const data = JSON.parse($(el).html() || "");
      if (data.isbn) isbn = isbn || data.isbn;
      if (data.numberOfPages)
        pageCount = pageCount || parseInt(data.numberOfPages);
    } catch {
      // ignore
    }
  });

  // --- Series ---
  let seriesName: string | null = null;
  let seriesNumber: number | null = null;

  // Goodreads shows series like "(Series Name #3)"
  const seriesText =
    $('h3.Text__italic a[href*="/series/"]').text().trim() ||
    $('div[data-testid="bookSeries"] a').text().trim() ||
    "";
  if (seriesText) {
    const match = seriesText.match(/^(.+?)\s*#(\d+)/);
    if (match) {
      seriesName = match[1].trim();
      seriesNumber = parseInt(match[2]);
    } else {
      seriesName = seriesText;
    }
  }

  return { title, author, coverUrl, description, isbn, pageCount, narrator: null, durationMinutes: null, seriesName, seriesNumber, seriesTotalBooks: null, sourceUrl: url };
}
