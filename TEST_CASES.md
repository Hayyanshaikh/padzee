# Padzee Test Cases (Manual)

> Scope: Core flows for notes, locking, clipboard, routing, and error handling.

## 1. Smoke / Startup
- **TC-001: Home redirects to new note**
  - Steps: Open `/` in browser.
  - Expected: Auto-redirects to `/note/new` and shows editor UI.

- **TC-002: New note initial state**
  - Steps: Open `/note/new`.
  - Expected:
    - Title input shows `Untitled`.
    - Content editor is editable.
    - Save button is enabled.
    - Lock badge is hidden.

## 2. Create & Save
- **TC-010: Save new note (basic)**
  - Steps: Enter title and content, click Save.
  - Expected:
    - Toast: “Note created successfully”.
    - URL changes to `/note/<slug>`.
    - Footer URL input shows full note URL.

- **TC-011: Title required**
  - Steps: Clear title and click Save.
  - Expected: Toast “Title is required” and no save.

- **TC-012: Slug updates with title**
  - Steps: On `/note/new`, change title text.
  - Expected: The note slug (in footer URL) updates to slugified title.

- **TC-013: Slug unique**
  - Steps: Create a note titled “Test Note”, save. Create another new note with same title, save.
  - Expected: Second note slug has `-####` suffix (random 4 digits).

- **TC-014: Save via keyboard shortcut**
  - Steps: On editable note, press `Ctrl+S` (Windows) / `Cmd+S` (Mac).
  - Expected: Save occurs and browser save dialog does not appear.

## 3. Load Existing Notes
- **TC-020: Load existing note**
  - Steps: Open an existing `/note/<slug>`.
  - Expected: Title and content load correctly; not in loading state.

- **TC-021: Note not found**
  - Steps: Open `/note/<non-existent-slug>`.
  - Expected: Toast “Note not found” and redirects to `/note/new`.

- **TC-022: API failure on load**
  - Steps: Break API (unset `NEXT_PUBLIC_API_URL` or stop API), open existing note.
  - Expected: Toast “Failed to load note” and loading stops.

## 4. Edit & Update
- **TC-030: Update note title/content**
  - Steps: Open an existing note, modify title/content, click Save.
  - Expected: Toast “Note updated successfully”; URL updates if slug changes.

- **TC-031: Slug change on edit**
  - Steps: Change title to a new value; save.
  - Expected: If slug changes, navigates to new `/note/<new-slug>`.

- **TC-032: Save disabled in view-only**
  - Steps: Open a locked note (hard lock or password lock not unlocked).
  - Expected: Save button is disabled.

## 5. Locking
- **TC-040: Set hard lock**
  - Steps: On a note you own, open Lock settings, choose “Hard lock”, save.
  - Expected: Lock badge shows “Hard locked”; editor is read-only with lock notice.

- **TC-041: Hard lock blocks editing**
  - Steps: Try typing in editor when hard locked.
  - Expected: Content is not editable; lock notice is visible.

- **TC-042: Set password lock**
  - Steps: Open Lock settings, select “Password”, enter password, save.
  - Expected: Lock badge shows “Password locked”; unlock action visible.

- **TC-043: Password required for password lock**
  - Steps: Select “Password” without entering a password, save.
  - Expected: Toast “Password is required for password lock”.

- **TC-044: Unlock with wrong password**
  - Steps: Click “Unlock to edit”, enter wrong password.
  - Expected: Toast “Incorrect password”; editing remains locked.

- **TC-045: Unlock with correct password**
  - Steps: Click “Unlock to edit”, enter correct password.
  - Expected: Toast “Unlocked for editing”; editing enabled.

- **TC-046: Change lock to none**
  - Steps: Open Lock settings, choose “No lock”, save.
  - Expected: Lock badge disappears; editor fully editable.

## 6. Permissions (Owner Fingerprint)
- **TC-050: Only owner can delete**
  - Steps: Open a note in a different browser/profile/device.
  - Expected: Delete option is hidden or blocked; toast says no permission if forced.

- **TC-051: Only owner can manage lock**
  - Steps: Open note from different fingerprint.
  - Expected: Lock/manage lock actions are not available.

## 7. Copy Actions
- **TC-060: Copy content**
  - Steps: Use “Copy content” action from menu.
  - Expected: Clipboard contains plain text (HTML stripped); toast “Content copied to clipboard”.

- **TC-061: Copy URL**
  - Steps: Click link icon in footer.
  - Expected: Clipboard contains current note URL; toast “URL copied to clipboard”.

## 8. Delete
- **TC-070: Delete note confirmation**
  - Steps: From actions menu, click “Delete note”.
  - Expected: Confirmation dialog appears; Cancel keeps note.

- **TC-071: Delete note success**
  - Steps: Confirm delete.
  - Expected: Toast “Note deleted”; redirects to `/note/new`.

- **TC-072: Delete note blocked**
  - Steps: Attempt delete from non-owner context.
  - Expected: Toast “You don't have permission to delete this note”.

## 9. UI / Responsiveness
- **TC-080: Desktop actions visible**
  - Steps: View on desktop width.
  - Expected: Actions buttons visible in header.

- **TC-081: Mobile menu**
  - Steps: View on small width (mobile).
  - Expected: Menu icon appears; actions inside dropdown.

## 10. Validation & Error Handling
- **TC-090: Save error handling**
  - Steps: Break API; attempt Save on new note.
  - Expected: Toast “An error occurred while saving”; saving stops.

- **TC-091: Lock update error handling**
  - Steps: Break API; update lock on existing note.
  - Expected: Toast “Failed to update lock”; lock state not changed.

- **TC-092: Fingerprint failure fallback**
  - Steps: Block fingerprint (privacy mode) or clear storage; attempt save.
  - Expected: If fingerprint cannot be obtained, toast “Unable to identify device”.

## 11. Security Basics
- **TC-100: Password hashing**
  - Steps: Set password lock; check API payload in network tab.
  - Expected: `lockPasswordHash` is a hash (not plain password).

## 12. Accessibility / UX
- **TC-110: Keyboard navigation**
  - Steps: Use Tab to move between header, editor, and footer.
  - Expected: Focus order logical; buttons are accessible.

- **TC-111: Dialog keyboard save**
  - Steps: In Lock dialog, press Enter.
  - Expected: Applies lock (same as Save).
