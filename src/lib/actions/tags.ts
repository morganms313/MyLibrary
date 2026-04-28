"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function getTags() {
  return prisma.tag.findMany({ orderBy: { name: "asc" } });
}

export async function createTag(name: string, color?: string) {
  const tag = await prisma.tag.create({
    data: { name, color: color || "#6366f1" },
  });
  revalidatePath("/");
  return tag;
}

export async function deleteTag(id: string) {
  await prisma.tag.delete({ where: { id } });
  revalidatePath("/");
}

export async function addTagToBook(bookId: string, tagId: string) {
  await prisma.bookTag.create({ data: { bookId, tagId } });
  revalidatePath(`/book/${bookId}`);
  revalidatePath("/");
}

export async function removeTagFromBook(bookId: string, tagId: string) {
  await prisma.bookTag.delete({
    where: { bookId_tagId: { bookId, tagId } },
  });
  revalidatePath(`/book/${bookId}`);
  revalidatePath("/");
}
