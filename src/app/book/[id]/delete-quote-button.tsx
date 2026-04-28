"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { deleteQuote } from "@/lib/actions/quotes";
import { Trash2, Loader2 } from "lucide-react";

export function DeleteQuoteButton({ quoteId }: { quoteId: string }) {
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
      title="Delete this quote?"
      description="This will permanently remove this quote."
      onConfirm={() => {
        startTransition(async () => {
          await deleteQuote(quoteId);
        });
      }}
    />
  );
}
