import { Note } from "@/lib/types";

/**
 * Export note as JSON
 */
export function exportNoteAsJSON(note: Note) {
  const dataStr = JSON.stringify(note, null, 2);
  const dataBlob = new Blob([dataStr], { type: "application/json" });
  downloadFile(dataBlob, `${note.slug}.json`);
}

/**
 * Export note as Markdown
 */
export function exportNoteAsMarkdown(note: Note) {
  let content = `# ${note.title}\n\n`;
  content += `*Created: ${new Date(note.createdAt).toLocaleString()}*\n\n`;
  content += note.content;

  const dataBlob = new Blob([content], { type: "text/markdown" });
  downloadFile(dataBlob, `${note.slug}.md`);
}

/**
 * Export note as HTML
 */
export function exportNoteAsHTML(note: Note) {
  const html = `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHtml(note.title)}</title>
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; line-height: 1.6; max-width: 900px; margin: 0 auto; padding: 20px; }
      h1 { margin-top: 0; }
      .meta { color: #666; font-size: 0.9em; margin-bottom: 20px; }
    </style>
  </head>
  <body>
    <h1>${escapeHtml(note.title)}</h1>
    <div class="meta">Created: ${new Date(note.createdAt).toLocaleString()}</div>
    <div>${note.content}</div>
  </body>
</html>
  `.trim();

  const dataBlob = new Blob([html], { type: "text/html" });
  downloadFile(dataBlob, `${note.slug}.html`);
}

/**
 * Export note as plain text
 */
export function exportNoteAsText(note: Note) {
  let content = `${note.title}\n`;
  content += `${"=".repeat(note.title.length)}\n\n`;
  content += `Created: ${new Date(note.createdAt).toLocaleString()}\n\n`;
  content += note.content.replace(/<[^>]*>/g, ""); // Strip HTML tags

  const dataBlob = new Blob([content], { type: "text/plain" });
  downloadFile(dataBlob, `${note.slug}.txt`);
}

/**
 * Helper function to trigger download
 */
function downloadFile(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Helper function to escape HTML
 */
function escapeHtml(text: string): string {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}
