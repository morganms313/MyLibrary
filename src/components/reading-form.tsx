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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StarRating } from "@/components/star-rating";
import { createReading, updateReading } from "@/lib/actions/readings";
import { STATUS_LABELS } from "@/lib/validations";
import { Loader2 } from "lucide-react";
import type { Reading } from "@/generated/prisma/client";

interface ReadingFormProps {
  bookId: string;
  reading?: Reading;
  trigger: React.ReactElement;
}

function formatDate(date: Date | null | undefined) {
  if (!date) return "";
  return new Date(date).toISOString().split("T")[0];
}

export function ReadingForm({ bookId, reading, trigger }: ReadingFormProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const [status, setStatus] = useState(reading?.status || "want_to_read");
  const [startDate, setStartDate] = useState(formatDate(reading?.startDate));
  const [finishDate, setFinishDate] = useState(
    formatDate(reading?.finishDate)
  );
  const [rating, setRating] = useState(reading?.rating || 0);
  const [notes, setNotes] = useState(reading?.notes || "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      if (reading) {
        await updateReading(reading.id, {
          status,
          startDate: startDate || undefined,
          finishDate: finishDate || undefined,
          rating: rating || undefined,
          notes,
        });
      } else {
        await createReading({
          bookId,
          status,
          startDate: startDate || undefined,
          finishDate: finishDate || undefined,
          rating: rating || undefined,
          notes,
        });
      }
      setOpen(false);
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {reading ? "Edit Reading" : "New Reading"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={status} onValueChange={(v: string | null) => v && setStatus(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(STATUS_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="finishDate">Finish Date</Label>
              <Input
                id="finishDate"
                type="date"
                value={finishDate}
                onChange={(e) => setFinishDate(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Rating</Label>
            <StarRating value={rating} onChange={setRating} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              placeholder="Your thoughts about this reading..."
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
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
              {reading ? "Save" : "Add Reading"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
