import type { ScrapedBookData } from "./types";

export async function scrapeGoogleBooks(
  url: string
): Promise<ScrapedBookData> {
  // Extract volume ID from URL like /books?id=ABC or /books/edition/Title/ABC
  let volumeId: string | null = null;

  const urlObj = new URL(url);
  volumeId = urlObj.searchParams.get("id");

  if (!volumeId) {
    const editionMatch = url.match(/\/books\/edition\/[^/]+\/([^/?]+)/);
    if (editionMatch) volumeId = editionMatch[1];
  }

  if (!volumeId) {
    return {
      title: null,
      author: null,
      coverUrl: null,
      description: null,
      isbn: null,
      pageCount: null,
      narrator: null,
      durationMinutes: null,
      seriesName: null,
      seriesNumber: null,
      seriesTotalBooks: null,
      sourceUrl: url,
    };
  }

  const res = await fetch(
    `https://www.googleapis.com/books/v1/volumes/${volumeId}`
  );
  const data = await res.json();
  const info = data.volumeInfo || {};

  return {
    title: info.title || null,
    author: info.authors?.join(", ") || null,
    coverUrl: info.imageLinks?.thumbnail?.replace("http://", "https://") || null,
    description: info.description?.substring(0, 1000) || null,
    isbn:
      info.industryIdentifiers?.find(
        (id: { type: string }) => id.type === "ISBN_13"
      )?.identifier ||
      info.industryIdentifiers?.find(
        (id: { type: string }) => id.type === "ISBN_10"
      )?.identifier ||
      null,
    pageCount: info.pageCount || null,
    narrator: null,
    durationMinutes: null,
    seriesName: null,
    seriesNumber: null,
    seriesTotalBooks: null,
    sourceUrl: url,
  };
}
