"use client";

import dynamic from "next/dynamic";
import "react-quill/dist/quill.snow.css";

const ReactQuill = dynamic(() => import("react-quill"), { ssr: false });

interface NoteEditorProps {
  content: string;
  onContentChange: (content: string) => void;
  isEditMode: boolean;
  isNewNote: boolean;
  isLockedForEditing: boolean;
}

export function NoteEditor({
  content,
  onContentChange,
  isEditMode,
  isNewNote,
  isLockedForEditing,
}: NoteEditorProps) {
  const modules = {
    toolbar: [
      ["bold", "italic", "strike"],
      [{ list: "ordered" }, { list: "bullet" }],
      ["clean"],
    ],
  };

  const formats = ["bold", "italic", "strike", "list", "bullet"];

  if (isLockedForEditing) {
    return (
      <main className="flex-1 flex flex-col max-w-5xl mx-auto w-full px-4 py-6">
        <div className="rounded-md border bg-red-100/50 border-red-300/50 py-2 px-4 text-sm text-red-800">
          This note is locked.
        </div>
        <div
          className="ql-editor custom-quill-view mt-6"
          style={{ padding: 0 }}
          dangerouslySetInnerHTML={{ __html: content }}
        />
      </main>
    );
  }

  if (!isEditMode && !isNewNote) {
    // View mode - show content with HTML
    return (
      <main className="flex-1 flex flex-col max-w-5xl mx-auto w-full px-4 py-6">
        <div
          className="ql-editor custom-quill-view"
          style={{ padding: 0 }}
          dangerouslySetInnerHTML={{ __html: content }}
        />
      </main>
    );
  }

  return (
    <main className="flex-1 flex flex-col max-w-5xl mx-auto w-full px-4 py-6">
      <div className="custom-quill-editor">
        <ReactQuill
          value={content}
          onChange={onContentChange}
          modules={modules}
          formats={formats}
          placeholder="Start writing your note..."
          theme="snow"
        />
      </div>
    </main>
  );
}
