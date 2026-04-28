"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

interface CreateReadingData {
  bookId: string;
  status?: string;
  startDate?: string;
  finishDate?: string;
  rating?: number | string;
  notes?: string;
}

interface UpdateReadingData {
  status?: string;
  startDate?: string;
  finishDate?: string;
  rating?: number | string;
  notes?: string;
}

export async function createReading(data: CreateReadingData) {
  const status = data.status || "want_to_read";
  const reading = await prisma.reading.create({
    data: {
      bookId: data.bookId,
      status,
      startDate: data.startDate
        ? new Date(data.startDate)
        : status === "reading"
          ? new Date()
          : null,
      finishDate: data.finishDate ? new Date(data.finishDate) : null,
      rating: data.rating ? Number(data.rating) : null,
      notes: data.notes || null,
    },
  });

  revalidatePath("/");
  revalidatePath(`/book/${data.bookId}`);
  return reading;
}

export async function updateReading(id: string, data: UpdateReadingData) {
  const existing = await prisma.reading.findUnique({ where: { id } });
  if (!existing) throw new Error("Reading not found");

  const isFinishing =
    data.status === "finished" && existing.status !== "finished";

  const reading = await prisma.reading.update({
    where: { id },
    data: {
      status: data.status,
      startDate:
        data.startDate !== undefined
          ? data.startDate
            ? new Date(data.startDate)
            : null
          : undefined,
      finishDate:
        data.finishDate !== undefined
          ? data.finishDate
            ? new Date(data.finishDate)
            : null
          : isFinishing
            ? new Date()
            : undefined,
      rating:
        data.rating !== undefined
          ? data.rating
            ? Number(data.rating)
            : null
          : undefined,
      notes: data.notes !== undefined ? data.notes || null : undefined,
    },
  });

  revalidatePath("/");
  revalidatePath(`/book/${existing.bookId}`);
  return reading;
}

export async function deleteReading(id: string) {
  const reading = await prisma.reading.findUnique({ where: { id } });
  if (!reading) throw new Error("Reading not found");

  await prisma.reading.delete({ where: { id } });

  revalidatePath("/");
  revalidatePath(`/book/${reading.bookId}`);
}
