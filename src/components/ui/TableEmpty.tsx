"use client";

export function TableEmpty({
  colSpan,
  message = "No data found",
}: {
  colSpan: number;
  message?: string;
}) {
  return (
    <tr>
      <td colSpan={colSpan} className="py-8 text-center text-sm text-zinc-500 dark:text-zinc-400">
        {message}
      </td>
    </tr>
  );
}
