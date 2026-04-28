"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function createQuote(data: {
  bookId: string;
  readingId?: string;
  text: string;
  page?: string;
}) {
  const quote = await prisma.quote.create({
    data: {
      bookId: data.bookId,
      readingId: data.readingId || null,
      text: data.text,
      page: data.page || null,
    },
  });
  revalidatePath(`/book/${data.bookId}`);
  return quote;
}

export async function updateQuote(
  id: string,
  data: { text?: string; page?: string }
) {
  const quote = await prisma.quote.findUnique({ where: { id } });
  if (!quote) throw new Error("Quote not found");

  const updated = await prisma.quote.update({
    where: { id },
    data: {
      text: data.text,
      page: data.page !== undefined ? data.page || null : undefined,
    },
  });
  revalidatePath(`/book/${quote.bookId}`);
  return updated;
}

export async function deleteQuote(id: string) {
  const quote = await prisma.quote.findUnique({ where: { id } });
  if (!quote) throw new Error("Quote not found");

  await prisma.quote.delete({ where: { id } });
  revalidatePath(`/book/${quote.bookId}`);
}
