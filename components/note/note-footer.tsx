import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link2, Save } from "lucide-react";

interface NoteFooterProps {
  noteUrl: string;
  onCopyUrl: () => void;
  onSave: () => void;
  isSaving: boolean;
  isEditMode: boolean;
  isNewNote: boolean;
}

export function NoteFooter({
  noteUrl,
  onCopyUrl,
  onSave,
  isSaving,
  isEditMode,
  isNewNote,
}: NoteFooterProps) {
  return (
    <footer className="border-t bg-background sticky bottom-0">
      <div className="max-w-5xl mx-auto px-4 py-4 flex items-center gap-4">
        <div className="flex-1 flex items-center gap-2">
          <Input
            value={noteUrl}
            readOnly
            className="flex-1 bg-transparent shadow-none focus:ring-0 focus:box-shadow-none focus-visible:ring-0 cursor-default text-sm text-muted-foreground"
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={onCopyUrl}
            className="shrink-0 border h-10 w-10 p-2"
          >
            <Link2 className="h-4 w-4" />
          </Button>
        </div>

        <Button
          onClick={onSave}
          disabled={isSaving || (!isEditMode && !isNewNote)}
          className="min-w-24"
        >
          <Save className="h-4 w-4 mr-2" />
          {isSaving ? "Saving..." : "Save"}
        </Button>
      </div>
    </footer>
  );
}
