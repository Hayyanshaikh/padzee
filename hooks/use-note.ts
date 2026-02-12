import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { generateSlug } from "@/lib/note-utils";
import { getBrowserFingerprint } from "@/lib/fingerprint";
import { hashPassword } from "@/lib/crypto";
import {
  fetchNoteBySlug,
  createNote,
  updateNote,
  ensureUniqueSlug,
  deleteNote,
} from "@/lib/api/notes";

type LockMode = "none" | "hard" | "password";

export function useNote(slug: string) {
  const router = useRouter();
  const isNewNote = slug === "new";

  const [title, setTitle] = useState("Untitled");
  const [content, setContent] = useState("");
  const [noteSlug, setNoteSlug] = useState("");
  const [noteId, setNoteId] = useState<string>("");
  const [noteOwnerFingerprint, setNoteOwnerFingerprint] = useState<
    string | null
  >(null);
  const [fingerprint, setFingerprint] = useState<string | null>(null);
  const [lockMode, setLockMode] = useState<LockMode>("none");
  const [lockPasswordHash, setLockPasswordHash] = useState<string | null>(null);
  const [isPasswordUnlocked, setIsPasswordUnlocked] = useState(true);
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
    if (typeof window === "undefined") return;
    const cached = window.localStorage.getItem("padzee_fingerprint");
    if (cached) {
      setFingerprint(cached);
      return;
    }

    let isMounted = true;
    getBrowserFingerprint()
      .then((id) => {
        if (!isMounted) return;
        window.localStorage.setItem("padzee_fingerprint", id);
        setFingerprint(id);
      })
      .catch((error) => {
        console.error("Failed to get fingerprint", error);
      });

    return () => {
      isMounted = false;
    };
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
        setNoteOwnerFingerprint(note.ownerFingerprint ?? null);
        const mode = (note.lockMode ?? "none") as LockMode;
        setLockMode(mode);
        setLockPasswordHash(note.lockPasswordHash ?? null);
        setIsPasswordUnlocked(mode !== "password");
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
    if (isLockedForEditing) {
      toast.error("This note is locked for editing");
      return;
    }

    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }

    if (lockMode === "password" && !lockPasswordHash) {
      toast.error("Password is required for password lock");
      return;
    }

    setIsSaving(true);

    try {
      if (isNewNote) {
        const baseSlug = generateSlug(title);
        const uniqueSlug = await ensureUniqueSlug(baseSlug);
        const ownerFingerprint = await ensureFingerprint();

        if (!ownerFingerprint) {
          toast.error("Unable to identify device");
          return;
        }

        const newNote = {
          title: title.trim(),
          content: content.trim(),
          slug: uniqueSlug,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          ownerFingerprint,
          lockMode,
          lockPasswordHash: lockMode === "password" ? lockPasswordHash : null,
          lockedAt: lockMode === "none" ? undefined : new Date().toISOString(),
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
          lockMode,
          lockPasswordHash: lockMode === "password" ? lockPasswordHash : null,
          lockedAt: lockMode === "none" ? undefined : new Date().toISOString(),
        };

        const savedNote = await updateNote(noteId, updatedNoteData);
        toast.success("Note updated successfully");

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

  async function ensureFingerprint(): Promise<string | null> {
    if (fingerprint) return fingerprint;
    if (typeof window === "undefined") return null;

    const cached = window.localStorage.getItem("padzee_fingerprint");
    if (cached) {
      setFingerprint(cached);
      return cached;
    }

    try {
      const id = await getBrowserFingerprint();
      window.localStorage.setItem("padzee_fingerprint", id);
      setFingerprint(id);
      return id;
    } catch (error) {
      console.error("Failed to get fingerprint", error);
      return null;
    }
  }

  async function handleDelete() {
    if (!noteId) return;
    if (!canDelete) {
      toast.error("You don't have permission to delete this note");
      return;
    }

    try {
      setIsSaving(true);
      await deleteNote(noteId);
      toast.success("Note deleted");
      router.push("/note/new");
    } catch (error) {
      toast.error("Failed to delete note");
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  }

  const canDelete =
    !isNewNote &&
    Boolean(fingerprint) &&
    Boolean(noteOwnerFingerprint) &&
    fingerprint === noteOwnerFingerprint;

  const canManageLock =
    isNewNote ||
    (Boolean(fingerprint) &&
      Boolean(noteOwnerFingerprint) &&
      fingerprint === noteOwnerFingerprint);

  const isLockedForEditing =
    !isNewNote &&
    (lockMode === "hard" || (lockMode === "password" && !isPasswordUnlocked));

  const isEditMode = !isLockedForEditing;

  async function handleUnlockWithPassword(password: string): Promise<boolean> {
    if (lockMode !== "password") return false;
    if (!lockPasswordHash) {
      toast.error("Password lock is not configured");
      return false;
    }

    try {
      const inputHash = await hashPassword(password);
      if (inputHash !== lockPasswordHash) {
        toast.error("Incorrect password");
        return false;
      }

      setIsPasswordUnlocked(true);
      toast.success("Unlocked for editing");
      return true;
    } catch (error) {
      toast.error("Failed to verify password");
      console.error(error);
      return false;
    }
  }

  async function handleUpdateLock(
    nextMode: LockMode,
    password?: string,
  ): Promise<boolean> {
    if (!canManageLock) {
      toast.error("You don't have permission to change lock");
      return false;
    }

    let nextPasswordHash: string | null = null;
    if (nextMode === "password") {
      if (!password?.trim()) {
        toast.error("Password is required for password lock");
        return false;
      }

      try {
        nextPasswordHash = await hashPassword(password.trim());
      } catch (error) {
        toast.error("Failed to secure password");
        console.error(error);
        return false;
      }
    }

    if (isNewNote) {
      setLockMode(nextMode);
      setLockPasswordHash(nextPasswordHash);
      setIsPasswordUnlocked(nextMode !== "password");
      toast.success("Lock updated");
      return true;
    }

    try {
      setIsSaving(true);
      const updatedNoteData = {
        title: title.trim(),
        content: content.trim(),
        slug: noteSlug,
        updatedAt: new Date().toISOString(),
        lockMode: nextMode,
        lockPasswordHash: nextPasswordHash,
        lockedAt: nextMode === "none" ? undefined : new Date().toISOString(),
      };

      const savedNote = await updateNote(noteId, updatedNoteData);
      setLockMode((savedNote.lockMode ?? nextMode) as LockMode);
      setLockPasswordHash(savedNote.lockPasswordHash ?? nextPasswordHash);
      setIsPasswordUnlocked(nextMode !== "password");
      toast.success("Lock updated");
      return true;
    } catch (error) {
      toast.error("Failed to update lock");
      console.error(error);
      return false;
    } finally {
      setIsSaving(false);
    }
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
    canDelete,
    canManageLock,
    lockMode,
    isPasswordUnlocked,
    isLockedForEditing,
    // Setters
    setTitle,
    setContent,
    // Handlers
    handleSave,
    handleCopyContent,
    handleNewNote,
    handleCopyUrl,
    handleDelete,
    handleUnlockWithPassword,
    handleUpdateLock,
  };
}
