"use client";

import { Spinner } from "./Spinner";

export function TableLoading({
  colSpan,
  message,
}: {
  colSpan: number;
  message?: string;
}) {
  return (
    <tr>
      <td colSpan={colSpan} className="py-12 text-center">
        <div className="flex justify-center">
          <Spinner size="md" label={message} />
        </div>
      </td>
    </tr>
  );
}
