"use client";

import { useEffect, useState } from "react";
import { UrlScraper } from "@/components/url-scraper";
import { AddBookForm } from "@/components/add-book-form";
import { Separator } from "@/components/ui/separator";
import type { ScrapedBookData } from "@/lib/scraper";
import type { Tag } from "@/generated/prisma/client";

export default function AddBookPage() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [scrapedData, setScrapedData] = useState<ScrapedBookData | null>(null);
  const [formKey, setFormKey] = useState(0);

  useEffect(() => {
    fetch("/api/tags")
      .then((res) => res.json())
      .then(setTags)
      .catch(() => {});
  }, []);

  const handleScraped = (data: ScrapedBookData) => {
    setScrapedData(data);
    setFormKey((k) => k + 1); // Force form re-mount with new defaults
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Add a Book</h1>

      <UrlScraper onScraped={handleScraped} />

      <Separator />

      <AddBookForm key={formKey} tags={tags} initialData={scrapedData} />
    </div>
  );
}
