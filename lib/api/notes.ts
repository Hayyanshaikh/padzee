import { Note } from "../types";

const API_URL: string = process.env.NEXT_PUBLIC_API_URL || "";

/**
 * Fetch all notes from the API
 */
export async function fetchNotes(): Promise<Note[]> {
  const response = await fetch(API_URL);
  if (!response.ok) {
    throw new Error("Failed to fetch notes");
  }
  return response.json();
}

/**
 * Fetch a single note by slug
 */
export async function fetchNoteBySlug(slug: string): Promise<Note | null> {
  const notes = await fetchNotes();
  return notes.find((n) => n.slug === slug) || null;
}

/**
 * Create a new note
 */
export async function createNote(noteData: {
  title: string;
  content: string;
  slug: string;
  createdAt: string;
  updatedAt: string;
  ownerFingerprint?: string;
  lockMode?: "none" | "hard" | "password";
  lockPasswordHash?: string | null;
  lockedAt?: string;
}): Promise<Note> {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(noteData),
  });

  if (!response.ok) {
    throw new Error("Failed to create note");
  }

  return response.json();
}

/**
 * Delete a note
 */
export async function deleteNote(noteId: string): Promise<void> {
  const response = await fetch(`${API_URL}/${noteId}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error("Failed to delete note");
  }
}

/**
 * Update an existing note
 */
export async function updateNote(
  noteId: string,
  noteData: {
    title: string;
    content: string;
    slug: string;
    updatedAt: string;
    lockMode?: "none" | "hard" | "password";
    lockPasswordHash?: string | null;
    lockedAt?: string | null;
  },
): Promise<Note> {
  const response = await fetch(`${API_URL}/${noteId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(noteData),
  });

  if (!response.ok) {
    throw new Error("Failed to update note");
  }

  return response.json();
}

/**
 * Ensure a slug is unique by appending a random ID if needed
 */
export async function ensureUniqueSlug(
  baseSlug: string,
  excludeId?: string,
): Promise<string> {
  try {
    const notes = await fetchNotes();
    let slug = baseSlug;
    const exists = notes.some((n) => n.slug === slug && n.id !== excludeId);

    if (exists) {
      const randomId = Math.floor(Math.random() * 10000)
        .toString()
        .padStart(4, "0");
      slug = `${baseSlug}-${randomId}`;
    }

    return slug;
  } catch {
    const randomId = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, "0");
    return `${baseSlug}-${randomId}`;
  }
}
