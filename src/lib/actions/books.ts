"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import type { CreateBookInput, UpdateBookInput } from "@/lib/validations";

export async function createBook(data: CreateBookInput) {
  const book = await prisma.book.create({
    data: {
      title: data.title,
      author: data.author,
      coverUrl: data.coverUrl || null,
      description: data.description || null,
      type: data.type,
      narrator: data.narrator || null,
      isbn: data.isbn || null,
      pageCount: data.pageCount ? Number(data.pageCount) : null,
      durationMinutes: data.durationHours || data.durationMinutes
        ? (Number(data.durationHours) || 0) * 60 + (Number(data.durationMinutes) || 0)
        : null,
      seriesName: data.seriesName || null,
      seriesNumber: data.seriesNumber ? Number(data.seriesNumber) : null,
      seriesTotalBooks: data.seriesTotalBooks ? Number(data.seriesTotalBooks) : null,
      sourceUrl: data.sourceUrl || null,
      readings: {
        create: {
          status: data.initialStatus || "want_to_read",
          startDate: data.startDate
            ? new Date(data.startDate)
            : data.initialStatus === "reading"
              ? new Date()
              : undefined,
          finishDate: data.finishDate
            ? new Date(data.finishDate)
            : data.initialStatus === "finished"
              ? new Date()
              : undefined,
        },
      },
      tags: data.tagIds.length
        ? { create: data.tagIds.map((tagId) => ({ tagId })) }
        : undefined,
    },
  });

  revalidatePath("/");
  return book;
}

export async function updateBook(id: string, data: UpdateBookInput) {
  const book = await prisma.book.update({
    where: { id },
    data: {
      title: data.title,
      author: data.author,
      coverUrl: data.coverUrl || null,
      description: data.description || null,
      type: data.type,
      narrator: data.narrator || null,
      isbn: data.isbn || null,
      pageCount: data.pageCount ? Number(data.pageCount) : null,
      durationMinutes: data.durationHours !== undefined || data.durationMinutes !== undefined
        ? (Number(data.durationHours) || 0) * 60 + (Number(data.durationMinutes) || 0) || null
        : undefined,
      seriesName: data.seriesName !== undefined ? data.seriesName || null : undefined,
      seriesNumber: data.seriesNumber ? Number(data.seriesNumber) : null,
      seriesTotalBooks: data.seriesTotalBooks ? Number(data.seriesTotalBooks) : null,
      sourceUrl: data.sourceUrl || null,
    },
  });

  revalidatePath("/");
  revalidatePath(`/book/${id}`);
  return book;
}

export async function checkDuplicate(title: string, author: string, excludeId?: string) {
  const match = await prisma.book.findFirst({
    where: {
      title: { equals: title },
      author: { equals: author },
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
    select: { id: true, title: true, author: true },
  });
  return match;
}

export async function deleteBook(id: string) {
  await prisma.book.delete({ where: { id } });
  revalidatePath("/");
}

export async function getBook(id: string) {
  return prisma.book.findUnique({
    where: { id },
    include: {
      readings: { orderBy: { createdAt: "desc" } },
      quotes: { orderBy: { createdAt: "desc" } },
      tags: { include: { tag: true } },
    },
  });
}

export interface BookFilters {
  search?: string;
  status?: string;
  rating?: number;
  tagIds?: string[];
  type?: string;
  sort?: string;
  series?: string;
}

export async function getBooks(filters: BookFilters = {}) {
  const books = await prisma.book.findMany({
    where: {
      ...(filters.search
        ? {
            OR: [
              { title: { contains: filters.search } },
              { author: { contains: filters.search } },
            ],
          }
        : {}),
      ...(filters.type ? { type: filters.type } : {}),
      ...(filters.series ? { seriesName: filters.series } : {}),
      ...(filters.tagIds?.length
        ? { tags: { some: { tagId: { in: filters.tagIds } } } }
        : {}),
    },
    include: {
      readings: { orderBy: { createdAt: "desc" } },
      tags: { include: { tag: true } },
    },
    orderBy: (() => {
      switch (filters.sort) {
        case "title":
          return { title: "asc" as const };
        case "author":
          return { author: "asc" as const };
        case "oldest":
          return { createdAt: "asc" as const };
        default:
          return { createdAt: "desc" as const };
      }
    })(),
  });

  // Post-filter by status and rating (derived from latest reading)
  return books.filter((book) => {
    const latestReading = book.readings[0];

    if (filters.status) {
      if (!latestReading || latestReading.status !== filters.status)
        return false;
    }

    if (filters.rating) {
      if (!latestReading || !latestReading.rating) return false;
      if (latestReading.rating < filters.rating) return false;
    }

    return true;
  });
}
