"use client";

import { cn } from "@/lib/utils";
import { BookOpen } from "lucide-react";
import { useState } from "react";

interface CoverImageProps {
  src?: string | null;
  title: string;
  className?: string;
}

export function CoverImage({ src, title, className }: CoverImageProps) {
  const [error, setError] = useState(false);

  if (!src || error) {
    const initials = title
      .split(" ")
      .slice(0, 2)
      .map((w) => w[0])
      .join("")
      .toUpperCase();

    return (
      <div
        className={cn(
          "bg-muted flex flex-col items-center justify-center rounded-md",
          className
        )}
      >
        <BookOpen className="h-8 w-8 text-muted-foreground/50 mb-1" />
        <span className="text-xs font-medium text-muted-foreground/70">
          {initials}
        </span>
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={`Cover of ${title}`}
      className={cn("rounded-md", className)}
      onError={() => setError(true)}
    />
  );
}
