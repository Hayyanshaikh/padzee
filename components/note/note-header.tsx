import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Copy, Plus, Trash2 } from "lucide-react";

type LockMode = "none" | "hard" | "password";

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

          {lockMode === "password" && !isPasswordUnlocked && (
            <Dialog open={unlockDialogOpen} onOpenChange={setUnlockDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  Unlock to edit
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Enter password</DialogTitle>
                  <DialogDescription>
                    This note is password locked. Enter the password to edit.
                  </DialogDescription>
                </DialogHeader>
                <Input
                  type="password"
                  placeholder="Password"
                  value={unlockPassword}
                  onChange={(e) => setUnlockPassword(e.target.value)}
                />
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setUnlockDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleUnlock}>Unlock</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}

          {canManageLock && (
            <Dialog open={lockDialogOpen} onOpenChange={setLockDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  {lockMode === "none" ? "Lock" : "Manage lock"}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Lock settings</DialogTitle>
                  <DialogDescription>
                    Choose how this note should be locked.
                  </DialogDescription>
                </DialogHeader>

                <Tabs
                  value={lockModeChoice}
                  onValueChange={(value) =>
                    setLockModeChoice(value as LockMode)
                  }
                >
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="none">No lock</TabsTrigger>
                    <TabsTrigger value="hard">Hard lock</TabsTrigger>
                    <TabsTrigger value="password">Password</TabsTrigger>
                  </TabsList>
                  <TabsContent value="password" className="grid gap-1">
                    <p className="text-sm text-muted-foreground">
                      Enter Password
                    </p>
                    <Input
                      type="password"
                      placeholder="Set password"
                      value={lockPassword}
                      onChange={(e) => setLockPassword(e.target.value)}
                    />
                  </TabsContent>
                </Tabs>

                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setLockDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleApplyLock}>Save</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}

          {!isNewNote && (
            <>
              <Button variant="outline" size="sm" onClick={onCopyContent}>
                <Copy className="h-4 w-4 mr-2" />
                Copy
              </Button>
              <Button variant="outline" size="sm" onClick={onNewNote}>
                <Plus className="h-4 w-4 mr-2" />
                New
              </Button>
              {canDelete && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
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
        </div>
      </div>
    </header>
  );
}
