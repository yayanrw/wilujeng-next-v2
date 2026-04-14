"use client";

import { Button } from "./Button";
import { Spinner } from "./Spinner";

export function LoadMoreButton({
  onClick,
  loading = false,
  hasMore = false,
  label = "Load more",
}: {
  onClick: () => void;
  loading?: boolean;
  hasMore?: boolean;
  label?: string;
}) {
  if (!hasMore) return null;

  return (
    <div className="border-t border-zinc-200 py-4 dark:border-zinc-800">
      <div className="flex justify-center">
        <Button
          variant="secondary"
          onClick={onClick}
          disabled={loading}
          className="w-full max-w-xs"
        >
          {loading ? (
            <Spinner size="sm" />
          ) : (
            label
          )}
        </Button>
      </div>
    </div>
  );
}
