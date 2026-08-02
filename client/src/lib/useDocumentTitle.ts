import { useEffect } from 'react';

// Sets the browser tab title as "<title> | ReadingHub".
// Pass undefined to skip (used when another component owns the title,
// e.g. a page with dynamic content like a book or author name).
// Pass an empty string to fall back to just "ReadingHub".
export function useDocumentTitle(title?: string) {
  useEffect(() => {
    if (title === undefined) return;
    document.title = title ? `${title} | ReadingHub` : 'ReadingHub';
  }, [title]);
}
