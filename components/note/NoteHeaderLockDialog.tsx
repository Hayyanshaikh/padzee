import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertTriangle } from "lucide-react";
import { LockMode } from "@/components/note/NoteHeaderTypes";

interface NoteHeaderLockDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lockModeChoice: LockMode;
  onLockModeChange: (value: LockMode) => void;
  lockPassword: string;
  onLockPasswordChange: (value: string) => void;
  onApplyLock: () => void;
}

export function NoteHeaderLockDialog({
  open,
  onOpenChange,
  lockModeChoice,
  onLockModeChange,
  lockPassword,
  onLockPasswordChange,
  onApplyLock,
}: NoteHeaderLockDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            onApplyLock();
          }
        }}
      >
        <DialogHeader>
          <DialogTitle>Lock settings</DialogTitle>
          <DialogDescription>
            Choose how this note should be locked.
          </DialogDescription>
        </DialogHeader>

        <Tabs
          value={lockModeChoice}
          onValueChange={(value) => onLockModeChange(value as LockMode)}
        >
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="none">No lock</TabsTrigger>
            <TabsTrigger value="hard">Hard lock</TabsTrigger>
            <TabsTrigger value="password">Password</TabsTrigger>
          </TabsList>
          <TabsContent value="hard" className="grid gap-1">
            <div className="inline-flex items-start gap-2 rounded-md border border-amber-300/60 bg-amber-50 px-3 py-2 text-sm text-amber-900">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                Hard lock disables editing for everyone. There is no unlock
                option.
              </span>
            </div>
          </TabsContent>
          <TabsContent value="password" className="grid gap-1">
            <p className="text-sm text-muted-foreground">Enter Password</p>
            <Input
              type="password"
              placeholder="Set password"
              value={lockPassword}
              onChange={(e) => onLockPasswordChange(e.target.value)}
            />
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onApplyLock}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
