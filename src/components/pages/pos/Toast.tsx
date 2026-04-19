'use client';

import { useEffect, useState } from 'react';

export function Toast({ message }: { message: string | null }) {
  const [kbHeight, setKbHeight] = useState(0);

  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;

    function update() {
      const hidden = window.innerHeight - (vv!.height + vv!.offsetTop);
      setKbHeight(Math.max(0, hidden));
    }

    vv.addEventListener('resize', update);
    vv.addEventListener('scroll', update);
    update();
    return () => {
      vv.removeEventListener('resize', update);
      vv.removeEventListener('scroll', update);
    };
  }, []);

  if (!message) return null;

  return (
    <div
      className="fixed left-1/2 z-[200] -translate-x-1/2 rounded-full bg-zinc-900 dark:bg-zinc-100 px-4 py-2 text-sm text-white dark:text-zinc-900 shadow-lg animate-in slide-in-from-bottom-5 fade-in duration-200 transition-[bottom] ease-out"
      style={{ bottom: kbHeight + 16 }}
    >
      {message}
    </div>
  );
}
