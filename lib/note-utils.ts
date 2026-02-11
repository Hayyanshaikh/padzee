/**
 * Generate a URL-friendly slug from a title
 */
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

/**
 * Generate a random 4-digit ID
 */
export function generateRandomId(): string {
  return Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, "0");
}
