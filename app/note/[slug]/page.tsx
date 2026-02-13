"use client";

import { useEffect } from "react";
import { useNote } from "@/hooks/use-note";
import { NoteHeader } from "@/components/note/NoteHeader";
import { NoteEditor } from "@/components/note/NoteEditor";
import { NoteFooter } from "@/components/note/NoteFooter";
import { NoteLoading } from "@/components/note/NoteLoading";

export default function NotePage({ params }: { params: { slug: string } }) {
  const {
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
    setTitle,
    setContent,
    handleSave,
    handleCopyContent,
    handleNewNote,
    handleCopyUrl,
    handleDelete,
    handleUnlockWithPassword,
    handleUpdateLock,
  } = useNote(params.slug);

  // Keyboard shortcut: Ctrl+S or Cmd+S to save
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault(); // Prevent browser's default save dialog
        if (!isLockedForEditing && !isSaving) {
          handleSave();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isLockedForEditing, isSaving, handleSave]);

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
        onCopyContent={handleCopyContent}
        onNewNote={handleNewNote}
        onDelete={handleDelete}
        canDelete={canDelete}
        lockMode={lockMode}
        isPasswordUnlocked={isPasswordUnlocked}
        isLockedForEditing={isLockedForEditing}
        canManageLock={canManageLock}
        onUnlockWithPassword={handleUnlockWithPassword}
        onUpdateLock={handleUpdateLock}
      />

      <NoteEditor
        content={content}
        onContentChange={setContent}
        isEditMode={isEditMode}
        isNewNote={isNewNote}
        isLockedForEditing={isLockedForEditing}
      />

      <NoteFooter
        noteUrl={noteUrl}
        onCopyUrl={handleCopyUrl}
        onSave={handleSave}
        isSaving={isSaving}
        isEditMode={isEditMode}
        isNewNote={isNewNote}
        isLockedForEditing={isLockedForEditing}
      />
    </div>
  );
}
