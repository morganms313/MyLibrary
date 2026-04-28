import { getBooks } from "@/lib/actions/books";
import { BookCard } from "@/components/book-card";
import { BookListItem } from "@/components/book-list-item";
import { LibraryFilters } from "@/components/library-filters";
import { BookOpen, Plus } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";

interface PageProps {
  searchParams: Promise<{
    q?: string;
    status?: string;
    type?: string;
    sort?: string;
    view?: string;
    rating?: string;
    tag?: string;
    series?: string;
  }>;
}

type BookWithRelations = Awaited<ReturnType<typeof getBooks>>[number];

function groupBySeries(books: BookWithRelations[]) {
  const seriesMap = new Map<
    string,
    { name: string; books: BookWithRelations[] }
  >();
  const standalone: BookWithRelations[] = [];

  for (const book of books) {
    if (book.seriesName) {
      const key = book.seriesName.toLowerCase();
      if (!seriesMap.has(key)) {
        seriesMap.set(key, { name: book.seriesName, books: [] });
      }
      seriesMap.get(key)!.books.push(book);
    } else {
      standalone.push(book);
    }
  }

  // Sort books within each series by seriesNumber
  for (const group of seriesMap.values()) {
    group.books.sort(
      (a, b) => (a.seriesNumber ?? 999) - (b.seriesNumber ?? 999)
    );
  }

  // Sort series alphabetically
  const sorted = Array.from(seriesMap.values()).sort((a, b) =>
    a.name.localeCompare(b.name)
  );

  return { series: sorted, standalone };
}

export default async function LibraryPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const books = await getBooks({
    search: params.q,
    status: params.status,
    type: params.type,
    sort: params.sort,
    rating: params.rating ? parseInt(params.rating) : undefined,
    tagIds: params.tag ? [params.tag] : undefined,
    series: params.series,
  });

  // When filtering by series, sort by book number
  if (params.series) {
    books.sort(
      (a, b) => (a.seriesNumber ?? 999) - (b.seriesNumber ?? 999)
    );
  }

  const view = params.view || "grid";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">
            {params.series || "My Library"}
          </h1>
          {params.series && (
            <Link
              href="/"
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              View all
            </Link>
          )}
        </div>
        <span className="text-sm text-muted-foreground">
          {books.length} {books.length === 1 ? "book" : "books"}
        </span>
      </div>

      <Suspense>
        <LibraryFilters />
      </Suspense>

      {books.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <BookOpen className="h-16 w-16 text-muted-foreground/30 mb-4" />
          <h2 className="text-lg font-medium text-muted-foreground mb-2">
            {params.q || params.status || params.type
              ? "No books match your filters"
              : "Your library is empty"}
          </h2>
          <p className="text-sm text-muted-foreground mb-6">
            {params.q || params.status || params.type
              ? "Try adjusting your search or filters"
              : "Start by adding your first book"}
          </p>
          {!params.q && !params.status && !params.type && (
            <Link
              href="/add"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Add your first book
            </Link>
          )}
        </div>
      ) : view === "series" ? (
        (() => {
          const { series, standalone } = groupBySeries(books);
          return (
            <div className="space-y-8">
              {series.map((group) => (
                <section key={group.name}>
                  <div className="flex items-baseline gap-2 mb-3">
                    <h2 className="text-lg font-semibold">{group.name}</h2>
                    <span className="text-xs text-muted-foreground">
                      {group.books.length}{" "}
                      {group.books.length === 1 ? "book" : "books"}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                    {group.books.map((book) => (
                      <BookCard key={book.id} book={book} />
                    ))}
                  </div>
                </section>
              ))}
              {standalone.length > 0 && (
                <section>
                  <div className="flex items-baseline gap-2 mb-3">
                    <h2 className="text-lg font-semibold text-muted-foreground">
                      Standalone
                    </h2>
                    <span className="text-xs text-muted-foreground">
                      {standalone.length}{" "}
                      {standalone.length === 1 ? "book" : "books"}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                    {standalone.map((book) => (
                      <BookCard key={book.id} book={book} />
                    ))}
                  </div>
                </section>
              )}
            </div>
          );
        })()
      ) : view === "list" ? (
        <div className="space-y-2">
          {books.map((book) => (
            <BookListItem key={book.id} book={book} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {books.map((book) => (
            <BookCard key={book.id} book={book} />
          ))}
        </div>
      )}
    </div>
  );
}
