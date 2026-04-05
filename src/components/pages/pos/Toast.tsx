'use client';

export function Toast({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div className="fixed bottom-4 left-1/2 z-[200] -translate-x-1/2 rounded-full bg-zinc-900 dark:bg-zinc-100 px-4 py-2 text-sm text-white dark:text-zinc-900 shadow-lg animate-in slide-in-from-bottom-5 fade-in duration-200">
      {message}
    </div>
  );
}
