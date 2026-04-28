import Link from "next/link";
import { CoverImage } from "./cover-image";
import { StatusBadge } from "./status-badge";
import { StarRating } from "./star-rating";
import { Headphones } from "lucide-react";
import type { Book, Reading, BookTag, Tag } from "@/generated/prisma/client";

type BookWithRelations = Book & {
  readings: Reading[];
  tags: (BookTag & { tag: Tag })[];
};

interface BookCardProps {
  book: BookWithRelations;
}

export function BookCard({ book }: BookCardProps) {
  const latestReading = book.readings[0];

  return (
    <Link href={`/book/${book.id}`} className="group block">
      <div className="rounded-lg border bg-card transition-all hover:shadow-md hover:border-foreground/20 overflow-hidden">
        <div className="aspect-[2/3] relative bg-muted">
          {book.coverUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={book.coverUrl}
              alt={book.title}
              style={{ width: "100%", height: "100%", objectFit: "contain" }}
              className="rounded-t-lg"
            />
          ) : (
            <CoverImage src={null} title={book.title} className="w-full h-full" />
          )}
          {book.type === "audiobook" && (
            <div className="absolute top-2 right-2 bg-background/90 rounded-full p-1.5">
              <Headphones className="h-3.5 w-3.5" />
            </div>
          )}
        </div>
        <div className="p-3 space-y-1.5">
          <h3 className="font-medium text-sm leading-tight line-clamp-2 group-hover:text-primary transition-colors">
            {book.title}
          </h3>
          <p className="text-xs text-muted-foreground line-clamp-1">
            {book.author}
          </p>
          {book.seriesName && (
            <p className="text-[10px] text-muted-foreground/70 line-clamp-1">
              {book.seriesName}
              {book.seriesNumber && (
                <> &middot; Book {book.seriesNumber}{book.seriesTotalBooks ? ` of ${book.seriesTotalBooks}` : ""}</>
              )}
            </p>
          )}
          <div className="flex items-center justify-between gap-2">
            {latestReading && <StatusBadge status={latestReading.status} />}
            {latestReading?.rating && (
              <StarRating value={latestReading.rating} size="sm" readonly />
            )}
          </div>
          {book.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 pt-0.5">
              {book.tags.slice(0, 3).map((bt) => (
                <span
                  key={bt.tag.id}
                  className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground"
                >
                  {bt.tag.name}
                </span>
              ))}
              {book.tags.length > 3 && (
                <span className="text-[10px] text-muted-foreground">
                  +{book.tags.length - 3}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
