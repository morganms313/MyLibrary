"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { deleteBook } from "@/lib/actions/books";
import { Trash2, Loader2 } from "lucide-react";

export function DeleteBookButton({ bookId }: { bookId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <ConfirmDialog
      trigger={
        <Button variant="outline" size="sm" className="gap-1 text-destructive">
          {isPending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Trash2 className="h-3.5 w-3.5" />
          )}
        </Button>
      }
      title="Delete this book?"
      description="This will permanently delete the book and all its readings, quotes, and tags. This cannot be undone."
      onConfirm={() => {
        startTransition(async () => {
          await deleteBook(bookId);
          router.push("/");
        });
      }}
    />
  );
}
