import type { ScrapedBookData } from "./types";

export async function lookupByIsbn(
  isbn: string,
  sourceUrl: string
): Promise<ScrapedBookData> {
  const res = await fetch(
    `https://openlibrary.org/isbn/${isbn}.json`
  );
  if (!res.ok) return emptyResult(sourceUrl);

  const edition = await res.json();

  // Get author from the works endpoint
  let author: string | null = null;
  if (edition.authors?.[0]?.key) {
    try {
      const authorRes = await fetch(
        `https://openlibrary.org${edition.authors[0].key}.json`
      );
      if (authorRes.ok) {
        const authorData = await authorRes.json();
        author = authorData.name || null;
      }
    } catch {
      // ignore
    }
  }

  // Get description from works endpoint
  let description: string | null = null;
  if (edition.works?.[0]?.key) {
    try {
      const workRes = await fetch(
        `https://openlibrary.org${edition.works[0].key}.json`
      );
      if (workRes.ok) {
        const workData = await workRes.json();
        const desc = workData.description;
        description =
          typeof desc === "string"
            ? desc.substring(0, 1000)
            : desc?.value?.substring(0, 1000) || null;
      }
    } catch {
      // ignore
    }
  }

  const coverId = edition.covers?.[0];

  return {
    title: edition.title || null,
    author,
    coverUrl: coverId
      ? `https://covers.openlibrary.org/b/id/${coverId}-L.jpg`
      : null,
    description,
    isbn,
    pageCount: edition.number_of_pages || null,
    narrator: null,
    durationMinutes: null,
    seriesName: null,
    seriesNumber: null,
    seriesTotalBooks: null,
    sourceUrl,
  };
}

export async function searchByTitle(
  title: string,
  sourceUrl: string
): Promise<ScrapedBookData> {
  const res = await fetch(
    `https://openlibrary.org/search.json?q=${encodeURIComponent(title)}&limit=1`
  );
  if (!res.ok) return emptyResult(sourceUrl);

  const data = await res.json();
  const book = data.docs?.[0];
  if (!book) return emptyResult(sourceUrl);

  const coverId = book.cover_i;

  return {
    title: book.title || null,
    author: book.author_name?.[0] || null,
    coverUrl: coverId
      ? `https://covers.openlibrary.org/b/id/${coverId}-L.jpg`
      : null,
    description: null,
    isbn: book.isbn?.[0] || null,
    pageCount: book.number_of_pages_median || null,
    narrator: null,
    durationMinutes: null,
    seriesName: null,
    seriesNumber: null,
    seriesTotalBooks: null,
    sourceUrl,
  };
}

function emptyResult(sourceUrl: string): ScrapedBookData {
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
    sourceUrl,
  };
}
