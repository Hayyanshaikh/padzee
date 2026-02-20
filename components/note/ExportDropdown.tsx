"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { Note } from "@/lib/types";
import {
  exportNoteAsJSON,
  exportNoteAsMarkdown,
  exportNoteAsHTML,
  exportNoteAsText,
} from "@/lib/export-notes";
import { usePlan } from "@/hooks/use-plan";

interface ExportDropdownProps {
  note: Note;
}

export function ExportDropdown({ note }: ExportDropdownProps) {
  const { plan } = usePlan();

  if (plan === "free") {
    return null; // Export not available for free plan
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel className="text-xs">Export format</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => exportNoteAsMarkdown(note)}>
          Markdown (.md)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => exportNoteAsJSON(note)}>
          JSON (.json)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => exportNoteAsHTML(note)}>
          HTML (.html)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => exportNoteAsText(note)}>
          Plain Text (.txt)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
