import { z } from "zod";

export const bookTypeEnum = z.enum(["book", "audiobook"]);
export const statusEnum = z.enum([
  "want_to_read",
  "reading",
  "finished",
  "abandoned",
]);

export const createBookSchema = z.object({
  title: z.string().min(1, "Title is required"),
  author: z.string().min(1, "Author is required"),
  coverUrl: z.string().url().optional().or(z.literal("")),
  description: z.string().optional(),
  type: bookTypeEnum.default("book"),
  narrator: z.string().optional(),
  isbn: z.string().optional(),
  pageCount: z.coerce.number().int().positive().optional().or(z.literal("")),
  durationHours: z.coerce.number().int().min(0).optional().or(z.literal("")),
  durationMinutes: z.coerce.number().int().min(0).max(59).optional().or(z.literal("")),
  seriesName: z.string().optional(),
  seriesNumber: z.coerce.number().int().positive().optional().or(z.literal("")),
  seriesTotalBooks: z.coerce.number().int().positive().optional().or(z.literal("")),
  sourceUrl: z.string().url().optional().or(z.literal("")),
  initialStatus: statusEnum.default("want_to_read"),
  startDate: z.string().optional(),
  finishDate: z.string().optional(),
  tagIds: z.array(z.string()).default([]),
});

export const updateBookSchema = createBookSchema.partial().omit({
  initialStatus: true,
  tagIds: true,
});

export const createReadingSchema = z.object({
  bookId: z.string(),
  status: statusEnum.default("want_to_read"),
  startDate: z.string().optional(),
  finishDate: z.string().optional(),
  rating: z.coerce.number().int().min(1).max(5).optional().or(z.literal("")),
  notes: z.string().optional(),
});

export const updateReadingSchema = createReadingSchema.partial().omit({
  bookId: true,
});

export const createQuoteSchema = z.object({
  bookId: z.string(),
  readingId: z.string().optional(),
  text: z.string().min(1, "Quote text is required"),
  page: z.string().optional(),
});

export const scrapeUrlSchema = z.object({
  url: z.string().url("Please enter a valid URL"),
});

export type CreateBookInput = z.infer<typeof createBookSchema>;
export type UpdateBookInput = z.infer<typeof updateBookSchema>;
export type CreateReadingInput = z.infer<typeof createReadingSchema>;
export type UpdateReadingInput = z.infer<typeof updateReadingSchema>;
export type CreateQuoteInput = z.infer<typeof createQuoteSchema>;
export type BookType = z.infer<typeof bookTypeEnum>;
export type Status = z.infer<typeof statusEnum>;

export const STATUS_LABELS: Record<Status, string> = {
  want_to_read: "Want to Read",
  reading: "Currently Reading",
  finished: "Finished",
  abandoned: "Abandoned",
};

export const STATUS_COLORS: Record<Status, string> = {
  want_to_read: "bg-blue-100 text-blue-800",
  reading: "bg-amber-100 text-amber-800",
  finished: "bg-green-100 text-green-800",
  abandoned: "bg-gray-100 text-gray-800",
};
