import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Note } from "@/lib/types";
import { generateSlug } from "@/lib/note-utils";
import {
  fetchNoteBySlug,
  createNote,
  updateNote,
  ensureUniqueSlug,
} from "@/lib/api/notes";

export function useNote(slug: string) {
  const router = useRouter();
  const isNewNote = slug === "new";

  const [title, setTitle] = useState("Untitled");
  const [content, setContent] = useState("");
  const [noteSlug, setNoteSlug] = useState("");
  const [noteId, setNoteId] = useState<string>("");
  const [isEditMode, setIsEditMode] = useState(isNewNote);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!isNewNote) {
      loadNote();
    } else {
      const generatedSlug = generateSlug(title);
      setNoteSlug(generatedSlug);
    }
  }, []);

  useEffect(() => {
    if (isNewNote) {
      const generatedSlug = generateSlug(title);
      setNoteSlug(generatedSlug);
    }
  }, [title, isNewNote]);

  async function loadNote() {
    setIsLoading(true);
    try {
      const note = await fetchNoteBySlug(slug);

      if (note) {
        setTitle(note.title);
        setContent(note.content);
        setNoteSlug(note.slug);
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

        const savedNote = await createNote(newNote);
        toast.success("Note created successfully");
        router.push(`/note/${savedNote.slug}`);
      } else {
        const baseSlug = generateSlug(title);
        const uniqueSlug = await ensureUniqueSlug(baseSlug, noteId);

        const updatedNoteData = {
          title: title.trim(),
          content: content.trim(),
          slug: uniqueSlug,
          updatedAt: new Date().toISOString(),
        };

        const savedNote = await updateNote(noteId, updatedNoteData);
        toast.success("Note updated successfully");
        setIsEditMode(false);

        if (savedNote.slug !== slug) {
          router.push(`/note/${savedNote.slug}`);
        } else {
          setNoteSlug(savedNote.slug);
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
    }/note/${noteSlug}`;
    navigator.clipboard.writeText(noteUrl);
    toast.success("URL copied to clipboard");
  }

  function toggleEditMode() {
    setIsEditMode(!isEditMode);
  }

  return {
    // State
    title,
    content,
    noteSlug,
    isEditMode,
    isLoading,
    isSaving,
    isNewNote,
    // Setters
    setTitle,
    setContent,
    // Handlers
    handleSave,
    handleCopyContent,
    handleNewNote,
    handleCopyUrl,
    toggleEditMode,
  };
}
