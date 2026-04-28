"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Grid3X3, List, Search, Library } from "lucide-react";
import { cn } from "@/lib/utils";
import { STATUS_LABELS } from "@/lib/validations";

export function LibraryFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const setParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value && value !== "all") {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      router.push(`/?${params.toString()}`);
    },
    [router, searchParams]
  );

  const view = searchParams.get("view") || "grid";

  return (
    <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
      <div className="relative flex-1 w-full sm:max-w-xs">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search books..."
          defaultValue={searchParams.get("q") || ""}
          onChange={(e) => setParam("q", e.target.value)}
          className="pl-8"
        />
      </div>

      <Select
        value={searchParams.get("status") || "all"}
        onValueChange={(v: string | null) => v && setParam("status", v)}
      >
        <SelectTrigger className="w-full sm:w-[160px]">
          <SelectValue placeholder="All statuses" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All statuses</SelectItem>
          {Object.entries(STATUS_LABELS).map(([value, label]) => (
            <SelectItem key={value} value={value}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={searchParams.get("type") || "all"}
        onValueChange={(v: string | null) => v && setParam("type", v)}
      >
        <SelectTrigger className="w-full sm:w-[140px]">
          <SelectValue placeholder="All types" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All types</SelectItem>
          <SelectItem value="book">Books</SelectItem>
          <SelectItem value="audiobook">Audiobooks</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={searchParams.get("sort") || "newest"}
        onValueChange={(v: string | null) => v && setParam("sort", v)}
      >
        <SelectTrigger className="w-full sm:w-[140px]">
          <SelectValue placeholder="Sort by" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="newest">Newest first</SelectItem>
          <SelectItem value="oldest">Oldest first</SelectItem>
          <SelectItem value="title">Title A-Z</SelectItem>
          <SelectItem value="author">Author A-Z</SelectItem>
        </SelectContent>
      </Select>

      <div className="hidden sm:flex border rounded-md">
        <button
          onClick={() => setParam("view", "grid")}
          className={cn(
            "p-2 transition-colors",
            view === "grid"
              ? "bg-primary text-primary-foreground"
              : "hover:bg-muted"
          )}
          aria-label="Grid view"
        >
          <Grid3X3 className="h-4 w-4" />
        </button>
        <button
          onClick={() => setParam("view", "list")}
          className={cn(
            "p-2 transition-colors",
            view === "list"
              ? "bg-primary text-primary-foreground"
              : "hover:bg-muted"
          )}
          aria-label="List view"
        >
          <List className="h-4 w-4" />
        </button>
        <button
          onClick={() => setParam("view", "series")}
          className={cn(
            "p-2 transition-colors",
            view === "series"
              ? "bg-primary text-primary-foreground"
              : "hover:bg-muted"
          )}
          aria-label="Group by series"
        >
          <Library className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
