"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { deleteReading } from "@/lib/actions/readings";
import { Trash2, Loader2 } from "lucide-react";

export function DeleteReadingButton({
  readingId,
  isOnlyReading,
}: {
  readingId: string;
  isOnlyReading: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <ConfirmDialog
      trigger={
        <Button variant="ghost" size="sm" className="text-destructive">
          {isPending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Trash2 className="h-3.5 w-3.5" />
          )}
        </Button>
      }
      title="Delete this reading?"
      description={
        isOnlyReading
          ? "This is the only reading for this book. Deleting it will remove all reading progress."
          : "This will permanently delete this reading entry and its notes."
      }
      onConfirm={() => {
        startTransition(async () => {
          await deleteReading(readingId);
        });
      }}
    />
  );
}
