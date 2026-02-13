import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Copy, Lock, Menu, Plus, Trash2 } from "lucide-react";
import { LockMode } from "@/components/note/noteHeaderTypes";

interface NoteHeaderActionsProps {
  showUnlockAction: boolean;
  showLockAction: boolean;
  showContentActions: boolean;
  showAnyActions: boolean;
  lockMode: LockMode;
  canDelete: boolean;
  onUnlockOpen: () => void;
  onLockOpen: () => void;
  onCopyContent: () => void;
  onNewNote: () => void;
  onDelete: () => void;
}

export function NoteHeaderDesktopActions({
  showUnlockAction,
  showLockAction,
  showContentActions,
  lockMode,
  canDelete,
  onUnlockOpen,
  onLockOpen,
  onCopyContent,
  onNewNote,
  onDelete,
}: NoteHeaderActionsProps) {
  return (
    <div className="hidden sm:flex items-center gap-2">
      {showUnlockAction && (
        <Button
          variant="outline"
          size="sm"
          onClick={onUnlockOpen}
          data-testid="unlock-button"
        >
          Unlock to edit
        </Button>
      )}

      {showLockAction && (
        <Button
          variant="outline"
          size="sm"
          onClick={onLockOpen}
          data-testid="lock-button"
        >
          <Lock className="h-4 w-4 mr-2" />
          {lockMode === "none" ? "Lock" : "Manage lock"}
        </Button>
      )}

      {showContentActions && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" data-testid="actions-button">
              <Menu className="h-4 w-4 mr-2" />
              Actions
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onSelect={onCopyContent}>
              <Copy className="h-4 w-4 mr-2" />
              Copy content
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={onNewNote}>
              <Plus className="h-4 w-4 mr-2" />
              New note
            </DropdownMenuItem>
            {canDelete && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <DropdownMenuItem className="text-destructive">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete note
                  </DropdownMenuItem>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete note?</AlertDialogTitle>
                    <AlertDialogDescription>
                      The note will be removed permanently.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={onDelete}>
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}

export function NoteHeaderMobileMenu({
  showUnlockAction,
  showLockAction,
  showContentActions,
  showAnyActions,
  lockMode,
  canDelete,
  onUnlockOpen,
  onLockOpen,
  onCopyContent,
  onNewNote,
  onDelete,
}: NoteHeaderActionsProps) {
  if (!showAnyActions) return null;

  return (
    <div className="sm:hidden">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            data-testid="mobile-menu-button"
          >
            <Menu className="h-4 w-4" />
            <span className="sr-only">Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Note menu</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {showUnlockAction && (
            <DropdownMenuItem onSelect={onUnlockOpen}>
              Unlock to edit
            </DropdownMenuItem>
          )}
          {showLockAction && (
            <DropdownMenuItem onSelect={onLockOpen}>
              {lockMode === "none" ? "Lock" : "Manage lock"}
            </DropdownMenuItem>
          )}
          {(showUnlockAction || showLockAction) && showContentActions && (
            <DropdownMenuSeparator />
          )}
          {showContentActions && (
            <>
              <DropdownMenuItem onSelect={onCopyContent}>
                <Copy className="h-4 w-4 mr-2" />
                Copy content
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={onNewNote}>
                <Plus className="h-4 w-4 mr-2" />
                New note
              </DropdownMenuItem>
              {canDelete && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <DropdownMenuItem className="text-destructive">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete note
                    </DropdownMenuItem>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete note?</AlertDialogTitle>
                      <AlertDialogDescription>
                        The note will be removed permanently.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={onDelete}>
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
