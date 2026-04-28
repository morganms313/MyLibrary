"use client";

import { useState, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  createTag,
  addTagToBook,
  removeTagFromBook,
} from "@/lib/actions/tags";
import { Plus, X, Loader2 } from "lucide-react";
import type { Tag, BookTag } from "@/generated/prisma/client";

interface TagManagerProps {
  bookId: string;
  bookTags: (BookTag & { tag: Tag })[];
  allTags: Tag[];
}

export function TagManager({ bookId, bookTags, allTags }: TagManagerProps) {
  const [isPending, startTransition] = useTransition();
  const [newTagName, setNewTagName] = useState("");
  const [open, setOpen] = useState(false);

  const attachedTagIds = new Set(bookTags.map((bt) => bt.tagId));
  const availableTags = allTags.filter((t) => !attachedTagIds.has(t.id));

  const handleAddTag = (tagId: string) => {
    startTransition(async () => {
      await addTagToBook(bookId, tagId);
    });
  };

  const handleRemoveTag = (tagId: string) => {
    startTransition(async () => {
      await removeTagFromBook(bookId, tagId);
    });
  };

  const handleCreateAndAddTag = () => {
    if (!newTagName.trim()) return;
    startTransition(async () => {
      const tag = await createTag(newTagName.trim());
      await addTagToBook(bookId, tag.id);
      setNewTagName("");
    });
  };

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {bookTags.map((bt) => (
        <span
          key={bt.tagId}
          className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-muted"
        >
          <span
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: bt.tag.color }}
          />
          {bt.tag.name}
          <button
            onClick={() => handleRemoveTag(bt.tagId)}
            className="hover:text-destructive transition-colors"
            disabled={isPending}
          >
            <X className="h-3 w-3" />
          </button>
        </span>
      ))}

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          render={
            <Button variant="outline" size="sm" className="h-6 text-xs gap-1" />
          }
        >
          {isPending ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Plus className="h-3 w-3" />
          )}
          Tag
        </PopoverTrigger>
        <PopoverContent className="w-48 p-2" align="start">
          {availableTags.length > 0 && (
            <div className="space-y-1 mb-2">
              {availableTags.map((tag) => (
                <button
                  key={tag.id}
                  onClick={() => {
                    handleAddTag(tag.id);
                    setOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-2 py-1 text-xs rounded hover:bg-muted transition-colors"
                >
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: tag.color }}
                  />
                  {tag.name}
                </button>
              ))}
            </div>
          )}
          <div className="flex gap-1">
            <Input
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreateAndAddTag()}
              placeholder="New tag..."
              className="h-7 text-xs"
            />
            <Button
              size="sm"
              className="h-7"
              onClick={handleCreateAndAddTag}
              disabled={!newTagName.trim()}
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
