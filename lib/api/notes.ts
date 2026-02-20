import { Note } from "../types";

const API_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "https://6781237b85151f714b098b06.mockapi.io/api/v1";
const NOTES_ENDPOINT = `${API_URL}/public-notes`;

async function fetchAPI<T>(
  endpoint: string,
  options?: RequestInit,
): Promise<T> {
  const response = await fetch(endpoint, {
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

/**
 * Fetch all notes from the API
 */
export async function fetchNotes(): Promise<Note[]> {
  return fetchAPI<Note[]>(NOTES_ENDPOINT);
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
  return fetchAPI<Note>(NOTES_ENDPOINT, {
    method: "POST",
    body: JSON.stringify(noteData),
  });
}

/**
 * Delete a note
 */
export async function deleteNote(noteId: string): Promise<void> {
  await fetchAPI<void>(`${NOTES_ENDPOINT}/${noteId}`, {
    method: "DELETE",
  });
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
  return fetchAPI<Note>(`${NOTES_ENDPOINT}/${noteId}`, {
    method: "PUT",
    body: JSON.stringify(noteData),
  });
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
