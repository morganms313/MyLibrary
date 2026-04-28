"use client";

import { useState, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { createQuote, updateQuote } from "@/lib/actions/quotes";
import { Loader2 } from "lucide-react";
import type { Quote } from "@/generated/prisma/client";

interface QuoteFormProps {
  bookId: string;
  quote?: Quote;
  trigger: React.ReactElement;
}

export function QuoteForm({ bookId, quote, trigger }: QuoteFormProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const [text, setText] = useState(quote?.text || "");
  const [page, setPage] = useState(quote?.page || "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      if (quote) {
        await updateQuote(quote.id, { text, page: page || undefined });
      } else {
        await createQuote({ bookId, text, page: page || undefined });
      }
      if (!quote) {
        setText("");
        setPage("");
      }
      setOpen(false);
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{quote ? "Edit Quote" : "Add Quote"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="quoteText">Quote *</Label>
            <Textarea
              id="quoteText"
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={4}
              placeholder="Enter the quote..."
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="quotePage">Page / Location</Label>
            <Input
              id="quotePage"
              value={page}
              onChange={(e) => setPage(e.target.value)}
              placeholder="e.g., p. 42 or Chapter 3"
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending || !text.trim()}>
              {isPending && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
              {quote ? "Save" : "Add Quote"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
