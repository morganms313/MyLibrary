"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { CoverImage } from "@/components/cover-image";
import { createBook, updateBook, checkDuplicate } from "@/lib/actions/books";
import { STATUS_LABELS, type CreateBookInput } from "@/lib/validations";
import { Loader2, BookOpen, Headphones, AlertTriangle } from "lucide-react";
import type { Book, Tag } from "@/generated/prisma/client";
import type { ScrapedBookData } from "@/lib/scraper";

interface AddBookFormProps {
  mode?: "create" | "edit";
  book?: Book;
  tags: Tag[];
  selectedTagIds?: string[];
  initialData?: ScrapedBookData | null;
}

export function AddBookForm({
  mode = "create",
  book,
  tags,
  selectedTagIds = [],
  initialData,
}: AddBookFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [title, setTitle] = useState(
    book?.title || initialData?.title || ""
  );
  const [author, setAuthor] = useState(
    book?.author || initialData?.author || ""
  );
  const [coverUrl, setCoverUrl] = useState(
    book?.coverUrl || initialData?.coverUrl || ""
  );
  const [description, setDescription] = useState(
    book?.description || initialData?.description || ""
  );
  const [type, setType] = useState<"book" | "audiobook">(
    (book?.type as "book" | "audiobook") ||
    (initialData?.narrator || initialData?.durationMinutes ? "audiobook" : "book")
  );
  const [narrator, setNarrator] = useState(
    book?.narrator || initialData?.narrator || ""
  );
  const [isbn, setIsbn] = useState(book?.isbn || initialData?.isbn || "");
  const [pageCount, setPageCount] = useState(
    book?.pageCount?.toString() || initialData?.pageCount?.toString() || ""
  );
  const [durationHours, setDurationHours] = useState(
    book?.durationMinutes ? Math.floor(book.durationMinutes / 60).toString() :
    initialData?.durationMinutes ? Math.floor(initialData.durationMinutes / 60).toString() : ""
  );
  const [durationMins, setDurationMins] = useState(
    book?.durationMinutes ? (book.durationMinutes % 60).toString() :
    initialData?.durationMinutes ? (initialData.durationMinutes % 60).toString() : ""
  );
  const [seriesName, setSeriesName] = useState(
    book?.seriesName || initialData?.seriesName || ""
  );
  const [seriesNumber, setSeriesNumber] = useState(
    book?.seriesNumber?.toString() || initialData?.seriesNumber?.toString() || ""
  );
  const [seriesTotalBooks, setSeriesTotalBooks] = useState(
    book?.seriesTotalBooks?.toString() || initialData?.seriesTotalBooks?.toString() || ""
  );
  const [sourceUrl, setSourceUrl] = useState(
    book?.sourceUrl || initialData?.sourceUrl || ""
  );
  const [status, setStatus] = useState("want_to_read");
  const [startDate, setStartDate] = useState("");
  const [finishDate, setFinishDate] = useState("");
  const [tagIds, setTagIds] = useState<string[]>(selectedTagIds);
  const [duplicate, setDuplicate] = useState<{
    id: string;
    title: string;
    author: string;
  } | null>(null);
  const [skipDuplicateCheck, setSkipDuplicateCheck] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    startTransition(async () => {
      // Check for duplicates before creating
      if (mode === "create" && !skipDuplicateCheck && title && author) {
        const match = await checkDuplicate(title, author);
        if (match) {
          setDuplicate(match);
          return;
        }
      }
      if (mode === "edit" && book) {
        await updateBook(book.id, {
          title,
          author,
          coverUrl: coverUrl || "",
          description,
          type,
          narrator,
          isbn,
          pageCount: pageCount ? parseInt(pageCount) : ("" as unknown as undefined),
          durationHours: durationHours ? parseInt(durationHours) : ("" as unknown as undefined),
          durationMinutes: durationMins ? parseInt(durationMins) : ("" as unknown as undefined),
          seriesName,
          seriesNumber: seriesNumber ? parseInt(seriesNumber) : ("" as unknown as undefined),
          seriesTotalBooks: seriesTotalBooks ? parseInt(seriesTotalBooks) : ("" as unknown as undefined),
          sourceUrl: sourceUrl || "",
        });
        router.push(`/book/${book.id}`);
      } else {
        const data: CreateBookInput = {
          title,
          author,
          coverUrl: coverUrl || "",
          description,
          type,
          narrator,
          isbn,
          pageCount: pageCount ? parseInt(pageCount) : ("" as unknown as undefined),
          durationHours: durationHours ? parseInt(durationHours) : ("" as unknown as undefined),
          durationMinutes: durationMins ? parseInt(durationMins) : ("" as unknown as undefined),
          seriesName,
          seriesNumber: seriesNumber ? parseInt(seriesNumber) : ("" as unknown as undefined),
          seriesTotalBooks: seriesTotalBooks ? parseInt(seriesTotalBooks) : ("" as unknown as undefined),
          sourceUrl: sourceUrl || "",
          initialStatus: status as CreateBookInput["initialStatus"],
          startDate: startDate || undefined,
          finishDate: finishDate || undefined,
          tagIds,
        };
        const newBook = await createBook(data);
        router.push(`/book/${newBook.id}`);
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-6">
        {/* Cover preview */}
        <div className="space-y-2">
          <Label>Cover Preview</Label>
          <div className="aspect-[2/3] bg-muted rounded-md flex items-center justify-center overflow-hidden">
            <CoverImage
              src={coverUrl}
              title={title || "Book"}
              className="max-w-full max-h-full"
            />
          </div>
          <Input
            placeholder="Cover image URL"
            value={coverUrl}
            onChange={(e) => setCoverUrl(e.target.value)}
            className="text-xs"
          />
        </div>

        {/* Form fields */}
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="author">Author *</Label>
              <Input
                id="author"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Type</Label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setType("book")}
                className={cn(
                  "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm border transition-colors",
                  type === "book"
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border hover:border-foreground/30"
                )}
              >
                <BookOpen className="h-4 w-4" /> Book
              </button>
              <button
                type="button"
                onClick={() => setType("audiobook")}
                className={cn(
                  "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm border transition-colors",
                  type === "audiobook"
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border hover:border-foreground/30"
                )}
              >
                <Headphones className="h-4 w-4" /> Audiobook
              </button>
            </div>
          </div>

          {type === "audiobook" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="narrator">Narrator</Label>
                <Input
                  id="narrator"
                  value={narrator}
                  onChange={(e) => setNarrator(e.target.value)}
                  placeholder="Narrator name"
                />
              </div>
              <div className="space-y-2">
                <Label>Duration</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="durationHours"
                    type="number"
                    min="0"
                    value={durationHours}
                    onChange={(e) => setDurationHours(e.target.value)}
                    placeholder="0"
                    className="w-20"
                  />
                  <span className="text-sm text-muted-foreground">hr</span>
                  <Input
                    id="durationMins"
                    type="number"
                    min="0"
                    max="59"
                    value={durationMins}
                    onChange={(e) => setDurationMins(e.target.value)}
                    placeholder="0"
                    className="w-20"
                  />
                  <span className="text-sm text-muted-foreground">min</span>
                </div>
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="seriesName">Series</Label>
              <Input
                id="seriesName"
                value={seriesName}
                onChange={(e) => setSeriesName(e.target.value)}
                placeholder="e.g. The Lord of the Rings"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="seriesNumber">Book #</Label>
              <Input
                id="seriesNumber"
                type="number"
                value={seriesNumber}
                onChange={(e) => setSeriesNumber(e.target.value)}
                placeholder="e.g. 2"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="seriesTotalBooks">Total in Series</Label>
              <Input
                id="seriesTotalBooks"
                type="number"
                value={seriesTotalBooks}
                onChange={(e) => setSeriesTotalBooks(e.target.value)}
                placeholder="e.g. 3"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="isbn">ISBN</Label>
              <Input
                id="isbn"
                value={isbn}
                onChange={(e) => setIsbn(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pageCount">Pages</Label>
              <Input
                id="pageCount"
                type="number"
                value={pageCount}
                onChange={(e) => setPageCount(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sourceUrl">Source URL</Label>
              <Input
                id="sourceUrl"
                value={sourceUrl}
                onChange={(e) => setSourceUrl(e.target.value)}
              />
            </div>
          </div>

          {mode === "create" && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Initial Status</Label>
                  <Select value={status} onValueChange={(v) => v && setStatus(v)}>
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

              {tags.length > 0 && (
                <div className="space-y-2">
                  <Label>Tags</Label>
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag) => (
                      <button
                        key={tag.id}
                        type="button"
                        onClick={() =>
                          setTagIds((prev) =>
                            prev.includes(tag.id)
                              ? prev.filter((id) => id !== tag.id)
                              : [...prev, tag.id]
                          )
                        }
                        className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                          tagIds.includes(tag.id)
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border hover:border-foreground/30"
                        }`}
                      >
                        {tag.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {duplicate && (
        <div className="flex items-start gap-3 rounded-lg border border-amber-300 bg-amber-50 p-4">
          <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-amber-800">
              Possible duplicate
            </p>
            <p className="text-sm text-amber-700 mt-0.5">
              <Link
                href={`/book/${duplicate.id}`}
                className="underline hover:text-amber-900"
              >
                {duplicate.title}
              </Link>
              {" "}by {duplicate.author} is already in your library.
            </p>
            <div className="flex gap-2 mt-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => router.push(`/book/${duplicate.id}`)}
              >
                Go to existing book
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() => {
                  setSkipDuplicateCheck(true);
                  setDuplicate(null);
                }}
              >
                Add anyway
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-3 justify-end">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button type="submit" disabled={isPending || !title || !author}>
          {isPending && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
          {mode === "edit" ? "Save Changes" : "Add Book"}
        </Button>
      </div>
    </form>
  );
}
