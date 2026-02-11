"use client";

import { useEffect } from "react";
import { useNote } from "@/hooks/use-note";
import { NoteHeader } from "@/components/note/note-header";
import { NoteEditor } from "@/components/note/note-editor";
import { NoteFooter } from "@/components/note/note-footer";
import { NoteLoading } from "@/components/note/note-loading";

export default function NotePage({ params }: { params: { slug: string } }) {
  const {
    title,
    content,
    noteSlug,
    isEditMode,
    isLoading,
    isSaving,
    isNewNote,
    setTitle,
    setContent,
    handleSave,
    handleCopyContent,
    handleNewNote,
    handleCopyUrl,
    toggleEditMode,
  } = useNote(params.slug);

  // Keyboard shortcut: Ctrl+S or Cmd+S to save
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault(); // Prevent browser's default save dialog
        if ((isEditMode || isNewNote) && !isSaving) {
          handleSave();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isEditMode, isNewNote, isSaving, handleSave]);

  if (isLoading) {
    return <NoteLoading />;
  }

  const noteUrl = `${
    typeof window !== "undefined" ? window.location.origin : ""
  }/note/${noteSlug}`;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <NoteHeader
        title={title}
        onTitleChange={setTitle}
        isNewNote={isNewNote}
        isEditMode={isEditMode}
        onToggleEditMode={toggleEditMode}
        onCopyContent={handleCopyContent}
        onNewNote={handleNewNote}
      />

      <NoteEditor
        content={content}
        onContentChange={setContent}
        isEditMode={isEditMode}
        isNewNote={isNewNote}
      />

      <NoteFooter
        noteUrl={noteUrl}
        onCopyUrl={handleCopyUrl}
        onSave={handleSave}
        isSaving={isSaving}
        isEditMode={isEditMode}
        isNewNote={isNewNote}
      />
    </div>
  );
}
