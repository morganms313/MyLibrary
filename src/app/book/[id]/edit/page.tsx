import { notFound } from "next/navigation";
import { getBook } from "@/lib/actions/books";
import { getTags } from "@/lib/actions/tags";
import { AddBookForm } from "@/components/add-book-form";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditBookPage({ params }: PageProps) {
  const { id } = await params;
  const [book, tags] = await Promise.all([getBook(id), getTags()]);

  if (!book) return notFound();

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Edit Book</h1>
      <AddBookForm
        mode="edit"
        book={book}
        tags={tags}
        selectedTagIds={book.tags.map((bt) => bt.tagId)}
      />
    </div>
  );
}
