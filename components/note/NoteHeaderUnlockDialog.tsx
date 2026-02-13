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

interface NoteHeaderUnlockDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  password: string;
  onPasswordChange: (password: string) => void;
  onUnlock: () => void;
}

export function NoteHeaderUnlockDialog({
  open,
  onOpenChange,
  password,
  onPasswordChange,
  onUnlock,
}: NoteHeaderUnlockDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
          value={password}
          onChange={(e) => onPasswordChange(e.target.value)}
        />
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onUnlock}>Unlock</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
