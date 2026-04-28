export interface ScrapedBookData {
  title: string | null;
  author: string | null;
  coverUrl: string | null;
  description: string | null;
  isbn: string | null;
  pageCount: number | null;
  narrator: string | null;
  durationMinutes: number | null;
  seriesName: string | null;
  seriesNumber: number | null;
  seriesTotalBooks: number | null;
  sourceUrl: string;
}
