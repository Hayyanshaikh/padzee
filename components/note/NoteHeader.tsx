import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { NoteHeaderLockDialog } from "@/components/note/NoteHeaderLockDialog";
import { NoteHeaderUnlockDialog } from "@/components/note/NoteHeaderUnlockDialog";
import {
  NoteHeaderDesktopActions,
  NoteHeaderMobileMenu,
} from "@/components/note/NoteHeaderActions";
import { LockMode } from "@/components/note/NoteHeaderTypes";

interface NoteHeaderProps {
  title: string;
  onTitleChange: (title: string) => void;
  isNewNote: boolean;
  onCopyContent: () => void;
  onNewNote: () => void;
  onDelete: () => void;
  canDelete: boolean;
  lockMode: LockMode;
  isPasswordUnlocked: boolean;
  isLockedForEditing: boolean;
  canManageLock: boolean;
  onUnlockWithPassword: (password: string) => Promise<boolean>;
  onUpdateLock: (mode: LockMode, password?: string) => Promise<boolean>;
}

export function NoteHeader({
  title,
  onTitleChange,
  isNewNote,
  onCopyContent,
  onNewNote,
  onDelete,
  canDelete,
  lockMode,
  isPasswordUnlocked,
  isLockedForEditing,
  canManageLock,
  onUnlockWithPassword,
  onUpdateLock,
}: NoteHeaderProps) {
  const [lockDialogOpen, setLockDialogOpen] = useState(false);
  const [lockModeChoice, setLockModeChoice] = useState<LockMode>(lockMode);
  const [lockPassword, setLockPassword] = useState("");
  const [unlockDialogOpen, setUnlockDialogOpen] = useState(false);
  const [unlockPassword, setUnlockPassword] = useState("");

  useEffect(() => {
    if (!lockDialogOpen) return;
    setLockModeChoice(lockMode);
    setLockPassword("");
  }, [lockDialogOpen, lockMode]);

  useEffect(() => {
    if (!unlockDialogOpen) return;
    setUnlockPassword("");
  }, [unlockDialogOpen]);

  async function handleApplyLock() {
    const success = await onUpdateLock(
      lockModeChoice,
      lockModeChoice === "password" ? lockPassword : undefined,
    );
    if (success) {
      setLockDialogOpen(false);
      setLockPassword("");
    }
  }

  async function handleUnlock() {
    const success = await onUnlockWithPassword(unlockPassword);
    if (success) {
      setUnlockDialogOpen(false);
      setUnlockPassword("");
    }
  }

  const showLockBadge = lockMode !== "none";
  const lockLabel =
    lockMode === "hard"
      ? "Hard locked"
      : lockMode === "password"
        ? "Password locked"
        : "Unlocked";

  const isTitleDisabled = Boolean(isLockedForEditing);
  const showUnlockAction = lockMode === "password" && !isPasswordUnlocked;
  const showLockAction = canManageLock;
  const showContentActions = !isNewNote;
  const showAnyActions =
    showUnlockAction || showLockAction || showContentActions;

  return (
    <header className="border-b bg-background sticky top-0 z-10">
      <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
        <Input
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          className="text-lg font-semibold border-none shadow-none focus-visible:ring-0 px-0 max-w-md bg-transparent"
          placeholder="Untitled"
          disabled={isTitleDisabled}
        />

        <div className="flex items-center gap-2">
          {showLockBadge && (
            <Badge
              variant="secondary"
              className="hidden flex-[0_0_auto] sm:flex"
            >
              {lockLabel}
            </Badge>
          )}
          <NoteHeaderUnlockDialog
            open={unlockDialogOpen}
            onOpenChange={setUnlockDialogOpen}
            password={unlockPassword}
            onPasswordChange={setUnlockPassword}
            onUnlock={handleUnlock}
          />

          <NoteHeaderLockDialog
            open={lockDialogOpen}
            onOpenChange={setLockDialogOpen}
            lockModeChoice={lockModeChoice}
            onLockModeChange={setLockModeChoice}
            lockPassword={lockPassword}
            onLockPasswordChange={setLockPassword}
            onApplyLock={handleApplyLock}
          />

          <NoteHeaderDesktopActions
            showUnlockAction={showUnlockAction}
            showLockAction={showLockAction}
            showContentActions={showContentActions}
            showAnyActions={showAnyActions}
            lockMode={lockMode}
            canDelete={canDelete}
            onUnlockOpen={() => setUnlockDialogOpen(true)}
            onLockOpen={() => setLockDialogOpen(true)}
            onCopyContent={onCopyContent}
            onNewNote={onNewNote}
            onDelete={onDelete}
          />

          <NoteHeaderMobileMenu
            showUnlockAction={showUnlockAction}
            showLockAction={showLockAction}
            showContentActions={showContentActions}
            showAnyActions={showAnyActions}
            lockMode={lockMode}
            canDelete={canDelete}
            onUnlockOpen={() => setUnlockDialogOpen(true)}
            onLockOpen={() => setLockDialogOpen(true)}
            onCopyContent={onCopyContent}
            onNewNote={onNewNote}
            onDelete={onDelete}
          />
        </div>
      </div>
    </header>
  );
}
