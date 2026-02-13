import { createHash } from "crypto";
import {
  test,
  expect,
  Page,
  BrowserContext,
  Browser,
  TestInfo,
  Route,
} from "@playwright/test";

type LockMode = "none" | "hard" | "password";

type Note = {
  id: string;
  title: string;
  content: string;
  slug: string;
  createdAt: string;
  updatedAt: string;
  ownerFingerprint?: string;
  lockMode?: LockMode;
  lockPasswordHash?: string | null;
  lockedAt?: string;
};

type NotesStore = {
  notes: Note[];
  nextId: number;
  lastRequestBody?: Record<string, unknown> | null;
};

type MockOptions = {
  failMethods?: Array<"GET" | "POST" | "PUT" | "DELETE">;
  onRequest?: (body: Record<string, unknown>) => void;
};

function slugify(title: string) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function hashPassword(password: string) {
  return createHash("sha256").update(password).digest("hex");
}

function createNotesStore(initial: Note[] = []): NotesStore {
  return {
    notes: [...initial],
    nextId: initial.length + 1,
  };
}

function seedNote(
  store: NotesStore,
  data: Omit<Note, "id" | "createdAt" | "updatedAt"> & {
    createdAt?: string;
    updatedAt?: string;
  },
): Note {
  const now = new Date().toISOString();
  const note: Note = {
    id: String(store.nextId++),
    title: data.title,
    content: data.content,
    slug: data.slug ?? slugify(data.title),
    ownerFingerprint: data.ownerFingerprint,
    lockMode: data.lockMode ?? "none",
    lockPasswordHash: data.lockPasswordHash ?? null,
    lockedAt: data.lockedAt,
    createdAt: data.createdAt ?? now,
    updatedAt: data.updatedAt ?? now,
  };
  store.notes.push(note);
  return note;
}

async function mockNotesApi(
  target: Page | BrowserContext,
  store: NotesStore,
  options: MockOptions = {},
) {
  await target.route("**/__test_api/notes**", async (route: Route) => {
    const request = route.request();
    const method = request.method() as "GET" | "POST" | "PUT" | "DELETE";

    if (options.failMethods?.includes(method)) {
      await route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ error: "mock failure" }),
      });
      return;
    }

    const url = new URL(request.url());
    const isCollection = url.pathname.endsWith("/__test_api/notes");

    if (isCollection && method === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(store.notes),
      });
      return;
    }

    if (isCollection && method === "POST") {
      const body = request.postDataJSON() as Record<string, unknown>;
      store.lastRequestBody = body;
      options.onRequest?.(body);

      const created = seedNote(store, {
        title: String(body.title ?? ""),
        content: String(body.content ?? ""),
        slug: String(body.slug ?? ""),
        ownerFingerprint: body.ownerFingerprint
          ? String(body.ownerFingerprint)
          : undefined,
        lockMode: (body.lockMode as LockMode) ?? "none",
        lockPasswordHash:
          typeof body.lockPasswordHash === "string"
            ? body.lockPasswordHash
            : null,
        lockedAt: body.lockedAt ? String(body.lockedAt) : undefined,
        createdAt: body.createdAt ? String(body.createdAt) : undefined,
        updatedAt: body.updatedAt ? String(body.updatedAt) : undefined,
      });

      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify(created),
      });
      return;
    }

    const id = url.pathname.split("/").pop();
    const existingIndex = store.notes.findIndex((note) => note.id === id);

    if (!isCollection && method === "PUT") {
      if (existingIndex === -1) {
        await route.fulfill({ status: 404, body: "Not found" });
        return;
      }

      const body = request.postDataJSON() as Record<string, unknown>;
      store.lastRequestBody = body;
      options.onRequest?.(body);

      const existing = store.notes[existingIndex];
      const updated: Note = {
        ...existing,
        title: String(body.title ?? existing.title),
        content: String(body.content ?? existing.content),
        slug: String(body.slug ?? existing.slug),
        updatedAt: String(body.updatedAt ?? existing.updatedAt),
        lockMode: (body.lockMode as LockMode) ?? existing.lockMode,
        lockPasswordHash:
          typeof body.lockPasswordHash === "string"
            ? body.lockPasswordHash
            : (existing.lockPasswordHash ?? null),
        lockedAt:
          typeof body.lockedAt === "string" ? body.lockedAt : existing.lockedAt,
      };

      store.notes[existingIndex] = updated;

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(updated),
      });
      return;
    }

    if (!isCollection && method === "DELETE") {
      if (existingIndex === -1) {
        await route.fulfill({ status: 404, body: "Not found" });
        return;
      }

      store.notes.splice(existingIndex, 1);
      await route.fulfill({ status: 200, body: "" });
      return;
    }

    await route.fulfill({ status: 400, body: "Unhandled mock route" });
  });
}

async function initPage(
  page: Page,
  store: NotesStore,
  options: MockOptions & {
    fingerprint?: string;
    failFingerprint?: boolean;
  } = {},
) {
  const fingerprint = options.fingerprint ?? "owner-1";
  await page.addInitScript((fp: string) => {
    (
      window as unknown as { __TEST_FINGERPRINT__?: string }
    ).__TEST_FINGERPRINT__ = fp;
  }, fingerprint);

  if (options.failFingerprint) {
    await page.addInitScript(() => {
      (
        window as unknown as { __TEST_FINGERPRINT_FAIL__?: boolean }
      ).__TEST_FINGERPRINT_FAIL__ = true;
    });
  }

  await mockNotesApi(page, store, options);
}

async function createNoteFromUI(page: Page, title: string, content: string) {
  await page.goto("/note/new");
  await page.getByTestId("note-title").fill(title);
  await page.locator(".ql-editor").fill(content);
  await page.getByTestId("save-note").click();
  await expect(page.getByText("Note created successfully")).toBeVisible();
}

test.describe("Padzee E2E", () => {
  test("TC-001: Home redirects to new note", async ({
    page,
  }: {
    page: Page;
  }) => {
    const store = createNotesStore();
    await initPage(page, store);

    await page.goto("/");
    await expect(page).toHaveURL(/\/note\/new$/);
    await expect(page.getByTestId("note-editor")).toBeVisible();
  });

  test("TC-002: New note initial state", async ({ page }: { page: Page }) => {
    const store = createNotesStore();
    await initPage(page, store);

    await page.goto("/note/new");
    await expect(page.getByTestId("note-title")).toHaveValue("Untitled");
    await expect(page.locator(".ql-editor")).toHaveAttribute(
      "contenteditable",
      "true",
    );
    await expect(page.getByTestId("save-note")).toBeEnabled();
    await expect(page.getByTestId("lock-badge")).toHaveCount(0);
  });

  test("TC-010: Save new note (basic)", async ({ page }: { page: Page }) => {
    const store = createNotesStore();
    await initPage(page, store);

    await page.goto("/note/new");
    await page.getByTestId("note-title").fill("My First Note");
    await page.locator(".ql-editor").fill("Hello world");
    await page.getByTestId("save-note").click();

    await expect(page.getByText("Note created successfully")).toBeVisible();
    await expect(page).toHaveURL(/\/note\/my-first-note$/);
    const noteUrl = await page.getByTestId("note-url").inputValue();
    expect(noteUrl).toContain("/note/my-first-note");
  });

  test("TC-011: Title required", async ({ page }: { page: Page }) => {
    const store = createNotesStore();
    await initPage(page, store);

    await page.goto("/note/new");
    await page.getByTestId("note-title").fill("");
    await page.getByTestId("save-note").click();
    await expect(page.getByText("Title is required")).toBeVisible();
  });

  test("TC-012: Slug updates with title", async ({ page }: { page: Page }) => {
    const store = createNotesStore();
    await initPage(page, store);

    await page.goto("/note/new");
    await page.getByTestId("note-title").fill("My Amazing Note");
    const noteUrl = await page.getByTestId("note-url").inputValue();
    expect(noteUrl).toContain("/note/my-amazing-note");
  });

  test("TC-013: Slug unique", async ({ page }: { page: Page }) => {
    const store = createNotesStore();
    await initPage(page, store);

    await createNoteFromUI(page, "Test Note", "First content");
    await page.getByTestId("actions-button").click();
    await page.getByRole("menuitem", { name: "New note" }).click();

    await page.getByTestId("note-title").fill("Test Note");
    await page.locator(".ql-editor").fill("Second content");
    await page.getByTestId("save-note").click();

    await expect(page.getByText("Note created successfully")).toBeVisible();
    await expect(page).toHaveURL(/\/note\/test-note-\d{4}$/);
  });

  test("TC-014: Save via keyboard shortcut", async ({
    page,
  }: {
    page: Page;
  }) => {
    const store = createNotesStore();
    await initPage(page, store);

    await page.goto("/note/new");
    await page.getByTestId("note-title").fill("Shortcut Note");
    await page.locator(".ql-editor").fill("Saved with shortcut");
    await page.keyboard.press("Control+S");

    await expect(page.getByText("Note created successfully")).toBeVisible();
    await expect(page).toHaveURL(/\/note\/shortcut-note$/);
  });

  test("TC-020: Load existing note", async ({ page }: { page: Page }) => {
    const store = createNotesStore();
    const note = seedNote(store, {
      title: "Loaded Note",
      content: "<p>Hello from API</p>",
      slug: "loaded-note",
      ownerFingerprint: "owner-1",
    });
    await initPage(page, store, { fingerprint: "owner-1" });

    await page.goto(`/note/${note.slug}`);
    await expect(page.getByTestId("note-title")).toHaveValue("Loaded Note");
    await expect(page.locator(".ql-editor")).toContainText("Hello from API");
  });

  test("TC-021: Note not found", async ({ page }: { page: Page }) => {
    const store = createNotesStore();
    await initPage(page, store);

    await page.goto("/note/missing-note");
    await expect(page.getByText("Note not found")).toBeVisible();
    await expect(page).toHaveURL(/\/note\/new$/);
  });

  test("TC-022: API failure on load", async ({ page }: { page: Page }) => {
    const store = createNotesStore();
    await initPage(page, store, { failMethods: ["GET"] });

    await page.goto("/note/failing-note");
    await expect(page.getByText("Failed to load note")).toBeVisible();
    await expect(page.getByTestId("note-title")).toBeVisible();
  });

  test("TC-030: Update note title/content", async ({
    page,
  }: {
    page: Page;
  }) => {
    const store = createNotesStore();
    seedNote(store, {
      title: "Old Title",
      content: "<p>Old content</p>",
      slug: "old-title",
      ownerFingerprint: "owner-1",
    });
    await initPage(page, store, { fingerprint: "owner-1" });

    await page.goto("/note/old-title");
    await page.getByTestId("note-title").fill("Updated Title");
    await page.locator(".ql-editor").fill("Updated content");
    await page.getByTestId("save-note").click();

    await expect(page.getByText("Note updated successfully")).toBeVisible();
    await expect(page).toHaveURL(/\/note\/updated-title$/);
  });

  test("TC-031: Slug change on edit", async ({ page }: { page: Page }) => {
    const store = createNotesStore();
    seedNote(store, {
      title: "Alpha Title",
      content: "<p>Alpha</p>",
      slug: "alpha-title",
      ownerFingerprint: "owner-1",
    });
    await initPage(page, store, { fingerprint: "owner-1" });

    await page.goto("/note/alpha-title");
    await page.getByTestId("note-title").fill("New Slug Title");
    await page.getByTestId("save-note").click();

    await expect(page.getByText("Note updated successfully")).toBeVisible();
    await expect(page).toHaveURL(/\/note\/new-slug-title$/);
  });

  test("TC-032: Save disabled in view-only", async ({
    page,
  }: {
    page: Page;
  }) => {
    const store = createNotesStore();
    seedNote(store, {
      title: "Locked Note",
      content: "<p>Locked</p>",
      slug: "locked-note",
      ownerFingerprint: "owner-1",
      lockMode: "hard",
      lockedAt: new Date().toISOString(),
    });
    await initPage(page, store, { fingerprint: "owner-1" });

    await page.goto("/note/locked-note");
    await expect(page.getByTestId("save-note")).toBeDisabled();
  });

  test("TC-040: Set hard lock", async ({ page }: { page: Page }) => {
    const store = createNotesStore();
    await initPage(page, store, { fingerprint: "owner-1" });

    await createNoteFromUI(page, "Lockable Note", "Some content");
    await page.getByTestId("lock-button").click();
    await page.getByRole("tab", { name: "Hard lock" }).click();
    await page.getByTestId("lock-save").click();

    await expect(page.getByText("Lock updated")).toBeVisible();
    await expect(page.getByTestId("lock-badge")).toHaveText("Hard locked");
    await expect(page.getByText("This note is locked.")).toBeVisible();
  });

  test("TC-041: Hard lock blocks editing", async ({ page }: { page: Page }) => {
    const store = createNotesStore();
    await initPage(page, store, { fingerprint: "owner-1" });

    await createNoteFromUI(page, "Hard Lock Note", "Initial content");
    await page.getByTestId("lock-button").click();
    await page.getByRole("tab", { name: "Hard lock" }).click();
    await page.getByTestId("lock-save").click();

    await expect(page.locator(".ql-editor")).not.toHaveAttribute(
      "contenteditable",
      "true",
    );
    await expect(page.locator(".ql-editor")).toContainText("Initial content");
  });

  test("TC-042: Set password lock", async ({ page }: { page: Page }) => {
    const store = createNotesStore();
    await initPage(page, store, { fingerprint: "owner-1" });

    await createNoteFromUI(page, "Password Note", "Secret content");
    await page.getByTestId("lock-button").click();
    await page.getByRole("tab", { name: "Password" }).click();
    await page.getByTestId("lock-password-input").fill("pass1234");
    await page.getByTestId("lock-save").click();

    await expect(page.getByText("Lock updated")).toBeVisible();
    await expect(page.getByTestId("lock-badge")).toHaveText("Password locked");
    await expect(page.getByTestId("unlock-button")).toBeVisible();
  });

  test("TC-043: Password required for password lock", async ({
    page,
  }: {
    page: Page;
  }) => {
    const store = createNotesStore();
    await initPage(page, store, { fingerprint: "owner-1" });

    await createNoteFromUI(page, "Missing Password", "No password");
    await page.getByTestId("lock-button").click();
    await page.getByRole("tab", { name: "Password" }).click();
    await page.getByTestId("lock-save").click();

    await expect(
      page.getByText("Password is required for password lock"),
    ).toBeVisible();
  });

  test("TC-044: Unlock with wrong password", async ({
    page,
  }: {
    page: Page;
  }) => {
    const store = createNotesStore();
    seedNote(store, {
      title: "Protected Note",
      content: "<p>Protected</p>",
      slug: "protected-note",
      ownerFingerprint: "owner-1",
      lockMode: "password",
      lockPasswordHash: hashPassword("correct"),
      lockedAt: new Date().toISOString(),
    });
    await initPage(page, store, { fingerprint: "owner-1" });

    await page.goto("/note/protected-note");
    await page.getByTestId("unlock-button").click();
    await page.getByTestId("unlock-password-input").fill("wrong");
    await page.getByTestId("unlock-submit").click();

    await expect(page.getByText("Incorrect password")).toBeVisible();
    await expect(page.getByTestId("save-note")).toBeDisabled();
  });

  test("TC-045: Unlock with correct password", async ({
    page,
  }: {
    page: Page;
  }) => {
    const store = createNotesStore();
    seedNote(store, {
      title: "Protected Note",
      content: "<p>Protected</p>",
      slug: "protected-note",
      ownerFingerprint: "owner-1",
      lockMode: "password",
      lockPasswordHash: hashPassword("correct"),
      lockedAt: new Date().toISOString(),
    });
    await initPage(page, store, { fingerprint: "owner-1" });

    await page.goto("/note/protected-note");
    await page.getByTestId("unlock-button").click();
    await page.getByTestId("unlock-password-input").fill("correct");

    await page.getByTestId("unlock-submit").click();
    await expect(page.getByText("Unlocked for editing")).toBeVisible();
    await expect(page.getByTestId("save-note")).toBeEnabled();
  });

  test("TC-046: Change lock to none", async ({ page }: { page: Page }) => {
    const store = createNotesStore();
    await initPage(page, store, { fingerprint: "owner-1" });

    await createNoteFromUI(page, "Unlockable Note", "Content");
    await page.getByTestId("lock-button").click();
    await page.getByRole("tab", { name: "Password" }).click();
    await page.getByTestId("lock-password-input").fill("pass1234");
    await page.getByTestId("lock-save").click();
    await expect(page.getByText("Lock updated")).toBeVisible();

    await page.getByTestId("lock-button").click();
    await page.getByRole("tab", { name: "No lock" }).click();
    await page.getByTestId("lock-save").click();

    await expect(page.getByText("Lock updated")).toBeVisible();
    await expect(page.getByTestId("lock-badge")).toHaveCount(0);
  });

  test("TC-050: Only owner can delete", async ({
    browser,
  }: { browser: Browser }, testInfo: TestInfo) => {
    const store = createNotesStore();
    const note = seedNote(store, {
      title: "Owner Note",
      content: "<p>Owner</p>",
      slug: "owner-note",
      ownerFingerprint: "owner-1",
    });

    const baseURL = testInfo.project.use.baseURL as string;
    const context = await browser.newContext({
      baseURL,
      permissions: ["clipboard-read", "clipboard-write"],
    });
    await context.addInitScript(() => {
      (
        window as unknown as { __TEST_FINGERPRINT__?: string }
      ).__TEST_FINGERPRINT__ = "owner-2";
    });
    await mockNotesApi(context, store);

    const page = await context.newPage();
    await page.goto(`/note/${note.slug}`);
    await expect(page.getByTestId("actions-button")).toBeVisible();
    await page.getByTestId("actions-button").click();
    await expect(
      page.getByRole("menuitem", { name: "Delete note" }),
    ).toHaveCount(0);

    await context.close();
  });

  test("TC-051: Only owner can manage lock", async ({
    browser,
  }: { browser: Browser }, testInfo: TestInfo) => {
    const store = createNotesStore();
    const note = seedNote(store, {
      title: "Owner Locked",
      content: "<p>Owner</p>",
      slug: "owner-locked",
      ownerFingerprint: "owner-1",
    });

    const baseURL = testInfo.project.use.baseURL as string;
    const context = await browser.newContext({
      baseURL,
      permissions: ["clipboard-read", "clipboard-write"],
    });
    await context.addInitScript(() => {
      (
        window as unknown as { __TEST_FINGERPRINT__?: string }
      ).__TEST_FINGERPRINT__ = "owner-2";
    });
    await mockNotesApi(context, store);

    const page = await context.newPage();
    await page.goto(`/note/${note.slug}`);
    await expect(page.getByTestId("lock-button")).toHaveCount(0);

    await context.close();
  });

  test("TC-060: Copy content", async ({ page }: { page: Page }) => {
    const store = createNotesStore();
    seedNote(store, {
      title: "Clipboard Note",
      content: "<p>Hello <strong>World</strong></p>",
      slug: "clipboard-note",
      ownerFingerprint: "owner-1",
    });
    await initPage(page, store, { fingerprint: "owner-1" });

    await page.goto("/note/clipboard-note");
    await page.getByTestId("actions-button").click();
    await page.getByRole("menuitem", { name: "Copy content" }).click();
    await expect(page.getByText("Content copied to clipboard")).toBeVisible();

    const clipboardText = await page.evaluate(() =>
      navigator.clipboard.readText(),
    );
    expect(clipboardText).toBe("Hello World");
  });

  test("TC-061: Copy URL", async ({ page }: { page: Page }) => {
    const store = createNotesStore();
    seedNote(store, {
      title: "URL Note",
      content: "<p>URL</p>",
      slug: "url-note",
      ownerFingerprint: "owner-1",
    });
    await initPage(page, store, { fingerprint: "owner-1" });

    await page.goto("/note/url-note");
    await page.getByTestId("copy-url").click();
    await expect(page.getByText("URL copied to clipboard")).toBeVisible();

    const clipboardText = await page.evaluate(() =>
      navigator.clipboard.readText(),
    );
    expect(clipboardText).toContain("/note/url-note");
  });

  test("TC-070: Delete note confirmation", async ({ page }: { page: Page }) => {
    const store = createNotesStore();
    seedNote(store, {
      title: "Delete Note",
      content: "<p>Delete me</p>",
      slug: "delete-note",
      ownerFingerprint: "owner-1",
    });
    await initPage(page, store, { fingerprint: "owner-1" });

    await page.goto("/note/delete-note");
    await page.getByTestId("actions-button").click();
    await page.getByRole("menuitem", { name: "Delete note" }).click();
    await expect(page.getByText("Delete note?")).toBeVisible();
    await page.getByRole("button", { name: "Cancel" }).click();
    await expect(page).toHaveURL(/\/note\/delete-note$/);
  });

  test("TC-071: Delete note success", async ({ page }: { page: Page }) => {
    const store = createNotesStore();
    seedNote(store, {
      title: "Delete Success",
      content: "<p>Delete me</p>",
      slug: "delete-success",
      ownerFingerprint: "owner-1",
    });
    await initPage(page, store, { fingerprint: "owner-1" });

    await page.goto("/note/delete-success");
    await page.getByTestId("actions-button").click();
    await page.getByRole("menuitem", { name: "Delete note" }).click();
    await page.getByRole("button", { name: "Delete" }).click();

    await expect(page.getByText("Note deleted")).toBeVisible();
    await expect(page).toHaveURL(/\/note\/new$/);
  });

  test("TC-072: Delete note blocked", async ({ page }: { page: Page }) => {
    const store = createNotesStore();
    seedNote(store, {
      title: "Blocked Delete",
      content: "<p>Blocked</p>",
      slug: "blocked-delete",
      ownerFingerprint: "owner-1",
    });
    await initPage(page, store, { fingerprint: "owner-2" });

    await page.goto("/note/blocked-delete");
    await page.evaluate(() => {
      (
        window as unknown as {
          __PADZEE_E2E__?: { triggerDelete: () => void };
        }
      ).__PADZEE_E2E__?.triggerDelete();
    });

    await expect(
      page.getByText("You don't have permission to delete this note"),
    ).toBeVisible();
  });

  test("TC-080: Desktop actions visible", async ({ page }: { page: Page }) => {
    const store = createNotesStore();
    seedNote(store, {
      title: "Desktop Note",
      content: "<p>Desktop</p>",
      slug: "desktop-note",
      ownerFingerprint: "owner-1",
    });
    await initPage(page, store, { fingerprint: "owner-1" });

    await page.goto("/note/desktop-note");
    await expect(page.getByTestId("actions-button")).toBeVisible();
  });

  test("TC-081: Mobile menu", async ({ page }: { page: Page }) => {
    const store = createNotesStore();
    seedNote(store, {
      title: "Mobile Note",
      content: "<p>Mobile</p>",
      slug: "mobile-note",
      ownerFingerprint: "owner-1",
    });
    await initPage(page, store, { fingerprint: "owner-1" });

    await page.setViewportSize({ width: 375, height: 800 });
    await page.goto("/note/mobile-note");
    await expect(page.getByTestId("mobile-menu-button")).toBeVisible();
  });

  test("TC-090: Save error handling", async ({ page }: { page: Page }) => {
    const store = createNotesStore();
    await initPage(page, store, { failMethods: ["POST"] });

    await page.goto("/note/new");
    await page.getByTestId("note-title").fill("Error Note");
    await page.locator(".ql-editor").fill("Error content");
    await page.getByTestId("save-note").click();

    await expect(
      page.getByText("An error occurred while saving"),
    ).toBeVisible();
  });

  test("TC-091: Lock update error handling", async ({
    page,
  }: {
    page: Page;
  }) => {
    const store = createNotesStore();
    seedNote(store, {
      title: "Lock Fail",
      content: "<p>Lock</p>",
      slug: "lock-fail",
      ownerFingerprint: "owner-1",
    });
    await initPage(page, store, {
      fingerprint: "owner-1",
      failMethods: ["PUT"],
    });

    await page.goto("/note/lock-fail");
    await page.getByTestId("lock-button").click();
    await page.getByRole("tab", { name: "Hard lock" }).click();
    await page.getByTestId("lock-save").click();

    await expect(page.getByText("Failed to update lock")).toBeVisible();
    await expect(page.getByTestId("lock-badge")).toHaveCount(0);
  });

  test("TC-092: Fingerprint failure fallback", async ({
    page,
  }: {
    page: Page;
  }) => {
    const store = createNotesStore();
    await initPage(page, store, { failFingerprint: true });

    await page.goto("/note/new");
    await page.getByTestId("note-title").fill("Fingerprint Fail");
    await page.locator(".ql-editor").fill("Content");
    await page.getByTestId("save-note").click();

    await expect(page.getByText("Unable to identify device")).toBeVisible();
  });

  test("TC-100: Password hashing", async ({ page }: { page: Page }) => {
    const store = createNotesStore();
    seedNote(store, {
      title: "Hash Note",
      content: "<p>Hash</p>",
      slug: "hash-note",
      ownerFingerprint: "owner-1",
    });

    let lastPayload: Record<string, unknown> | undefined;
    await initPage(page, store, {
      fingerprint: "owner-1",
      onRequest: (body) => {
        lastPayload = body;
      },
    });

    await page.goto("/note/hash-note");
    await page.getByTestId("lock-button").click();
    await page.getByRole("tab", { name: "Password" }).click();
    await page.getByTestId("lock-password-input").fill("secret123");
    await page.getByTestId("lock-save").click();
    await expect(page.getByText("Lock updated")).toBeVisible();

    expect(lastPayload?.lockPasswordHash).toBeTruthy();
    expect(lastPayload?.lockPasswordHash).not.toBe("secret123");
  });

  test("TC-110: Keyboard navigation", async ({ page }: { page: Page }) => {
    const store = createNotesStore();
    await initPage(page, store);

    await page.goto("/note/new");
    await page.keyboard.press("Tab");
    await expect(page.getByTestId("note-title")).toBeFocused();

    const saveButton = page.getByTestId("save-note");
    for (let i = 0; i < 10; i += 1) {
      if (
        await saveButton.evaluate(
          (el: HTMLElement) => el === document.activeElement,
        )
      ) {
        break;
      }
      await page.keyboard.press("Tab");
    }
    await expect(saveButton).toBeFocused();
  });

  test("TC-111: Dialog keyboard save", async ({ page }: { page: Page }) => {
    const store = createNotesStore();
    await initPage(page, store, { fingerprint: "owner-1" });

    await createNoteFromUI(page, "Dialog Note", "Dialog content");
    await page.getByTestId("lock-button").click();
    await page.getByRole("tab", { name: "Hard lock" }).click();
    await page.getByTestId("lock-dialog").press("Enter");

    await expect(page.getByText("Lock updated")).toBeVisible();
    await expect(page.getByTestId("lock-badge")).toHaveText("Hard locked");
  });
});
