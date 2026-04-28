import { notFound } from "next/navigation";
import Link from "next/link";
import { getBook } from "@/lib/actions/books";
import { getTags } from "@/lib/actions/tags";
import { CoverImage } from "@/components/cover-image";
import { StatusBadge } from "@/components/status-badge";
import { StarRating } from "@/components/star-rating";
import { ReadingForm } from "@/components/reading-form";
import { QuoteForm } from "@/components/quote-form";
import { TagManager } from "@/components/tag-manager";
import { DeleteBookButton } from "./delete-button";
import { DeleteReadingButton } from "./delete-reading-button";
import { DeleteQuoteButton } from "./delete-quote-button";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Headphones,
  BookOpen,
  Pencil,
  Plus,
  ExternalLink,
  Quote,
  CalendarDays,
} from "lucide-react";
import { format } from "date-fns";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function BookDetailPage({ params }: PageProps) {
  const { id } = await params;
  const [book, allTags] = await Promise.all([getBook(id), getTags()]);

  if (!book) return notFound();

  const latestReading = book.readings[0];

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-6">
        <div className="w-48 flex-shrink-0 mx-auto sm:mx-0">
          {book.coverUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={book.coverUrl}
              alt={`Cover of ${book.title}`}
              className="w-full h-auto rounded-md"
            />
          ) : (
            <CoverImage
              src={null}
              title={book.title}
              className="w-full aspect-[2/3]"
            />
          )}
        </div>
        <div className="flex-1 space-y-3">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold">{book.title}</h1>
              <p className="text-lg text-muted-foreground">{book.author}</p>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <Link href={`/book/${book.id}/edit`}>
                <Button variant="outline" size="sm" className="gap-1">
                  <Pencil className="h-3.5 w-3.5" /> Edit
                </Button>
              </Link>
              <DeleteBookButton bookId={book.id} />
            </div>
          </div>

          {book.seriesName && (
            <p className="text-sm text-muted-foreground">
              <Link
                href={`/?series=${encodeURIComponent(book.seriesName)}`}
                className="text-primary underline underline-offset-2 hover:text-primary/80 transition-colors"
              >
                {book.seriesName}
              </Link>
              {book.seriesNumber && (
                <span>
                  {" "}
                  &middot; Book {book.seriesNumber}
                  {book.seriesTotalBooks && <> of {book.seriesTotalBooks}</>}
                </span>
              )}
            </p>
          )}

          <div className="flex items-center gap-3 flex-wrap">
            <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
              {book.type === "audiobook" ? (
                <Headphones className="h-4 w-4" />
              ) : (
                <BookOpen className="h-4 w-4" />
              )}
              {book.type === "audiobook" ? "Audiobook" : "Book"}
            </span>
            {book.narrator && (
              <span className="text-sm text-muted-foreground">
                Narrated by {book.narrator}
              </span>
            )}
            {book.pageCount && (
              <span className="text-sm text-muted-foreground">
                {book.pageCount} pages
              </span>
            )}
            {book.durationMinutes && (
              <span className="text-sm text-muted-foreground">
                {Math.floor(book.durationMinutes / 60)}h {book.durationMinutes % 60}m
              </span>
            )}
            {book.isbn && (
              <span className="text-sm text-muted-foreground">
                ISBN: {book.isbn}
              </span>
            )}
          </div>

          {latestReading && (
            <div className="flex items-center gap-3">
              <StatusBadge status={latestReading.status} />
              {latestReading.rating && (
                <StarRating value={latestReading.rating} size="md" readonly />
              )}
            </div>
          )}

          <TagManager bookId={book.id} bookTags={book.tags} allTags={allTags} />

          {book.description && (
            <p className="text-sm text-muted-foreground leading-relaxed line-clamp-4">
              {book.description}
            </p>
          )}

          {book.sourceUrl && (
            <a
              href={book.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <ExternalLink className="h-3 w-3" /> View source
            </a>
          )}
        </div>
      </div>

      <Separator />

      {/* Readings */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            Readings ({book.readings.length})
          </h2>
          <ReadingForm
            bookId={book.id}
            trigger={
              <Button variant="outline" size="sm" className="gap-1">
                <Plus className="h-3.5 w-3.5" /> New Reading
              </Button>
            }
          />
        </div>

        {book.readings.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            No readings yet. Start tracking your first read!
          </p>
        ) : (
          <div className="space-y-3">
            {book.readings.map((reading, index) => (
              <div
                key={reading.id}
                className="rounded-lg border p-4 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <StatusBadge status={reading.status} />
                    {reading.rating && (
                      <StarRating
                        value={reading.rating}
                        size="sm"
                        readonly
                      />
                    )}
                    {book.readings.length > 1 && (
                      <span className="text-xs text-muted-foreground">
                        Reading #{book.readings.length - index}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <ReadingForm
                      bookId={book.id}
                      reading={reading}
                      trigger={
                        <Button variant="ghost" size="sm">
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                      }
                    />
                    <DeleteReadingButton
                      readingId={reading.id}
                      isOnlyReading={book.readings.length === 1}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  {reading.startDate && (
                    <span className="inline-flex items-center gap-1">
                      <CalendarDays className="h-3 w-3" />
                      Started {format(new Date(reading.startDate), "MMM d, yyyy")}
                    </span>
                  )}
                  {reading.finishDate && (
                    <span className="inline-flex items-center gap-1">
                      <CalendarDays className="h-3 w-3" />
                      Finished{" "}
                      {format(new Date(reading.finishDate), "MMM d, yyyy")}
                    </span>
                  )}
                </div>

                {reading.notes && (
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {reading.notes}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      <Separator />

      {/* Quotes */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            Quotes ({book.quotes.length})
          </h2>
          <QuoteForm
            bookId={book.id}
            trigger={
              <Button variant="outline" size="sm" className="gap-1">
                <Plus className="h-3.5 w-3.5" /> Add Quote
              </Button>
            }
          />
        </div>

        {book.quotes.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            No quotes saved yet. Add your favorite passages!
          </p>
        ) : (
          <div className="space-y-3">
            {book.quotes.map((quote) => (
              <div key={quote.id} className="rounded-lg border p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <Quote className="h-4 w-4 text-muted-foreground/50 mb-1" />
                    <p className="text-sm italic">{quote.text}</p>
                    {quote.page && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {quote.page}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <QuoteForm
                      bookId={book.id}
                      quote={quote}
                      trigger={
                        <Button variant="ghost" size="sm">
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                      }
                    />
                    <DeleteQuoteButton quoteId={quote.id} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
