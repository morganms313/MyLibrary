"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Link as LinkIcon } from "lucide-react";
import type { ScrapedBookData } from "@/lib/scraper";

interface UrlScraperProps {
  onScraped: (data: ScrapedBookData) => void;
}

export function UrlScraper({ onScraped }: UrlScraperProps) {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFetch = async () => {
    if (!url.trim()) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to fetch book details");
      }

      const data: ScrapedBookData = await res.json();

      if (!data.title) {
        setError(
          "Could not extract book details from this URL. You can fill in the details manually below."
        );
      }

      onScraped(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch book details"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Add from URL</label>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <LinkIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Paste an Amazon, Goodreads, or Google Books link..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleFetch()}
            className="pl-8"
          />
        </div>
        <Button onClick={handleFetch} disabled={loading || !url.trim()}>
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-1" />
              Fetching...
            </>
          ) : (
            "Fetch"
          )}
        </Button>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
