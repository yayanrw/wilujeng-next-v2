#!/bin/bash

# A script to inject basic dark mode classes into components

find src/components/pages src/components/shared -name "*.tsx" -type f -exec sed -i '' \
  -e 's/bg-white/bg-white dark:bg-zinc-950/g' \
  -e 's/border-zinc-200/border-zinc-200 dark:border-zinc-800/g' \
  -e 's/border-zinc-100/border-zinc-100 dark:border-zinc-800/g' \
  -e 's/text-zinc-900/text-zinc-900 dark:text-zinc-50/g' \
  -e 's/text-zinc-800/text-zinc-800 dark:text-zinc-200/g' \
  -e 's/text-zinc-700/text-zinc-700 dark:text-zinc-300/g' \
  -e 's/text-zinc-600/text-zinc-600 dark:text-zinc-400/g' \
  -e 's/text-zinc-500/text-zinc-500 dark:text-zinc-400/g' \
  -e 's/bg-zinc-50/bg-zinc-50 dark:bg-zinc-900/g' \
  -e 's/bg-zinc-100/bg-zinc-100 dark:bg-zinc-800/g' \
  -e 's/bg-zinc-200/bg-zinc-200 dark:bg-zinc-800/g' \
  -e 's/hover:bg-zinc-50/hover:bg-zinc-50 dark:hover:bg-zinc-900/g' \
  -e 's/hover:bg-zinc-100/hover:bg-zinc-100 dark:hover:bg-zinc-800/g' \
  -e 's/hover:bg-zinc-200/hover:bg-zinc-200 dark:hover:bg-zinc-700/g' \
  -e 's/bg-zinc-900/bg-zinc-900 dark:bg-zinc-100/g' \
  -e 's/text-white/text-white dark:text-zinc-900/g' \
  {} +
