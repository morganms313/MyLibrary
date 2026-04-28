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

interface BookListItemProps {
  book: BookWithRelations;
}

export function BookListItem({ book }: BookListItemProps) {
  const latestReading = book.readings[0];

  return (
    <Link
      href={`/book/${book.id}`}
      className="group flex items-center gap-4 p-3 rounded-lg border bg-card hover:shadow-md hover:border-foreground/20 transition-all"
    >
      <div className="w-12 h-16 flex-shrink-0 flex items-center justify-center bg-muted rounded-md overflow-hidden">
        <CoverImage
          src={book.coverUrl}
          title={book.title}
          className="max-w-full max-h-full"
        />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="font-medium text-sm truncate group-hover:text-primary transition-colors">
            {book.title}
          </h3>
          {book.type === "audiobook" && (
            <Headphones className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
          )}
        </div>
        <p className="text-xs text-muted-foreground truncate">
          {book.author}
          {book.seriesName && (
            <span className="text-muted-foreground/60">
              {" "}&middot; {book.seriesName}
              {book.seriesNumber ? ` · Book ${book.seriesNumber}${book.seriesTotalBooks ? ` of ${book.seriesTotalBooks}` : ""}` : ""}
            </span>
          )}
        </p>
      </div>
      <div className="flex items-center gap-3 flex-shrink-0">
        {book.tags.length > 0 && (
          <div className="hidden sm:flex gap-1">
            {book.tags.slice(0, 2).map((bt) => (
              <span
                key={bt.tag.id}
                className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground"
              >
                {bt.tag.name}
              </span>
            ))}
          </div>
        )}
        {latestReading?.rating && (
          <StarRating value={latestReading.rating} size="sm" readonly />
        )}
        {latestReading && <StatusBadge status={latestReading.status} />}
      </div>
    </Link>
  );
}
