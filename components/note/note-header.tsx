import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FileEdit, Copy, Plus } from "lucide-react";

interface NoteHeaderProps {
  title: string;
  onTitleChange: (title: string) => void;
  isNewNote: boolean;
  isEditMode: boolean;
  onToggleEditMode: () => void;
  onCopyContent: () => void;
  onNewNote: () => void;
}

export function NoteHeader({
  title,
  onTitleChange,
  isNewNote,
  isEditMode,
  onToggleEditMode,
  onCopyContent,
  onNewNote,
}: NoteHeaderProps) {
  return (
    <header className="border-b bg-background sticky top-0 z-10">
      <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
        <Input
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          className="text-lg font-semibold border-none shadow-none focus-visible:ring-0 px-0 max-w-md bg-transparent"
          placeholder="Untitled"
          disabled={!isEditMode && !isNewNote}
        />

        {!isNewNote && (
          <div className="flex items-center gap-2">
            <Button
              variant={isEditMode ? "default" : "outline"}
              size="sm"
              onClick={onToggleEditMode}
            >
              <FileEdit className="h-4 w-4 mr-2" />
              {isEditMode ? "Editing" : "Edit"}
            </Button>
            <Button variant="outline" size="sm" onClick={onCopyContent}>
              <Copy className="h-4 w-4 mr-2" />
              Copy
            </Button>
            <Button variant="outline" size="sm" onClick={onNewNote}>
              <Plus className="h-4 w-4 mr-2" />
              New
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}
