"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Copy, FileEdit, Link2, Plus, Save } from "lucide-react";
import { toast } from "sonner";

interface Note {
  id: string;
  title: string;
  content: string;
  slug: string;
  createdAt: string;
  updatedAt: string;
}

const API_URL: string = process.env.NEXT_PUBLIC_API_URL || "";

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function generateRandomId(): string {
  return Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, "0");
}

async function ensureUniqueSlug(
  baseSlug: string,
  excludeId?: string
): Promise<string> {
  try {
    const response = await fetch(API_URL);
    const notes: Note[] = await response.json();

    let slug = baseSlug;
    let exists = notes.some((n) => n.slug === slug && n.id !== excludeId);

    if (exists) {
      slug = `${baseSlug}-${generateRandomId()}`;
    }

    return slug;
  } catch {
    return `${baseSlug}-${generateRandomId()}`;
  }
}

export default function NotePage({ params }: { params: { slug: string } }) {
  const router = useRouter();
  const isNewNote = params.slug === "new";

  const [title, setTitle] = useState("Untitled");
  const [content, setContent] = useState("");
  const [slug, setSlug] = useState("");
  const [noteId, setNoteId] = useState<string>("");
  const [isEditMode, setIsEditMode] = useState(isNewNote);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!isNewNote) {
      loadNote();
    } else {
      const generatedSlug = generateSlug(title);
      setSlug(generatedSlug);
    }
  }, []);

  useEffect(() => {
    if (isNewNote) {
      const generatedSlug = generateSlug(title);
      setSlug(generatedSlug);
    }
  }, [title, isNewNote]);

  async function loadNote() {
    setIsLoading(true);
    try {
      const response = await fetch(API_URL);
      const notes: Note[] = await response.json();
      const note = notes.find((n) => n.slug === params.slug);

      if (note) {
        setTitle(note.title);
        setContent(note.content);
        setSlug(note.slug);
        setNoteId(note.id);
      } else {
        toast.error("Note not found");
        router.push("/note/new");
      }
    } catch (error) {
      toast.error("Failed to load note");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSave() {
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }

    setIsSaving(true);

    try {
      if (isNewNote) {
        const baseSlug = generateSlug(title);
        const uniqueSlug = await ensureUniqueSlug(baseSlug);

        const newNote = {
          title: title.trim(),
          content: content.trim(),
          slug: uniqueSlug,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        const response = await fetch(API_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(newNote),
        });

        if (response.ok) {
          const savedNote: Note = await response.json();
          toast.success("Note created successfully");
          router.push(`/note/${savedNote.slug}`);
        } else {
          toast.error("Failed to create note");
        }
      } else {
        const baseSlug = generateSlug(title);
        const uniqueSlug = await ensureUniqueSlug(baseSlug, noteId);

        const updatedNote = {
          title: title.trim(),
          content: content.trim(),
          slug: uniqueSlug,
          updatedAt: new Date().toISOString(),
        };

        const response = await fetch(`${API_URL}/${noteId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updatedNote),
        });

        if (response.ok) {
          const savedNote: Note = await response.json();
          toast.success("Note updated successfully");
          setIsEditMode(false);

          if (savedNote.slug !== params.slug) {
            router.push(`/note/${savedNote.slug}`);
          } else {
            setSlug(savedNote.slug);
          }
        } else {
          toast.error("Failed to update note");
        }
      }
    } catch (error) {
      toast.error("An error occurred while saving");
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  }

  function handleCopyContent() {
    navigator.clipboard.writeText(content);
    toast.success("Content copied to clipboard");
  }

  function handleNewNote() {
    router.push("/note/new");
  }

  function handleCopyUrl() {
    const noteUrl = `${
      typeof window !== "undefined" ? window.location.origin : ""
    }/note/${slug}`;
    navigator.clipboard.writeText(noteUrl);
    toast.success("URL copied to clipboard");
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  const noteUrl = `${
    typeof window !== "undefined" ? window.location.origin : ""
  }/note/${slug}`;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="border-b bg-background sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="text-lg font-semibold border-none shadow-none focus-visible:ring-0 px-0 max-w-md bg-transparent"
            placeholder="Untitled"
            disabled={!isEditMode && !isNewNote}
          />

          {!isNewNote && (
            <div className="flex items-center gap-2">
              <Button
                variant={isEditMode ? "default" : "outline"}
                size="sm"
                onClick={() => setIsEditMode(!isEditMode)}
              >
                <FileEdit className="h-4 w-4 mr-2" />
                {isEditMode ? "Editing" : "Edit"}
              </Button>
              <Button variant="outline" size="sm" onClick={handleCopyContent}>
                <Copy className="h-4 w-4 mr-2" />
                Copy
              </Button>
              <Button variant="outline" size="sm" onClick={handleNewNote}>
                <Plus className="h-4 w-4 mr-2" />
                New
              </Button>
            </div>
          )}
        </div>
      </header>

      <main className="flex-1 flex flex-col max-w-5xl mx-auto w-full px-4 py-6">
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Start writing your note..."
          className="flex-1 resize-none border-none shadow-none p-0 border-none focus-visible:border-0 focus-visible:ring-0 leading-relaxed min-h-[calc(100vh-16rem)] bg-transparent"
          disabled={!isEditMode && !isNewNote}
        />
      </main>

      <footer className="border-t bg-background sticky bottom-0">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center gap-4">
          <Button
            onClick={handleSave}
            disabled={isSaving || (!isEditMode && !isNewNote)}
            className="min-w-24"
          >
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? "Saving..." : "Save"}
          </Button>
          <div className="flex-1 flex items-center gap-2">
            <Input
              value={noteUrl}
              readOnly
              className="flex-1 bg-transparent shadow-none focus:ring-0 focus:box-shadow-none focus-visible:ring-0 cursor-default text-sm text-muted-foreground"
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopyUrl}
              className="shrink-0"
            >
              <Link2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </footer>
    </div>
  );
}
