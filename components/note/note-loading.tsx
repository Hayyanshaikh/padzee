import { Skeleton } from "@/components/ui/skeleton";

export function NoteLoading() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="border-b bg-background sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <Skeleton className="h-10 w-64" />
        </div>
      </header>

      <main className="flex-1 flex flex-col max-w-5xl mx-auto w-full px-4 py-6">
        <div className="space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </main>

      <footer className="border-t bg-background sticky bottom-0">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center gap-4">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 w-24" />
        </div>
      </footer>
    </div>
  );
}
