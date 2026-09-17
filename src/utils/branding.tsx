import React from 'react';

/**
 * Formats a hackathon/event title with two-tone styling (e.g. BUILD and red ATHON).
 * Handles spaced words, names ending in ATHON, and general event titles.
 */
export function formatBrandingTitle(name: string): React.ReactNode {
  const trimmed = (name || 'BUILDATHON').trim();
  if (!trimmed) return 'EVENT';

  if (trimmed.includes(' ')) {
    const parts = trimmed.split(' ');
    const last = parts.pop();
    return (
      <>
        {parts.join(' ')} <span>{last}</span>
      </>
    );
  }

  const upper = trimmed.toUpperCase();
  if (upper.endsWith('ATHON') && trimmed.length > 5) {
    const prefix = trimmed.slice(0, -5);
    const suffix = trimmed.slice(-5);
    return (
      <>
        {prefix}<span>{suffix}</span>
      </>
    );
  }

  if (trimmed.length <= 3) {
    return trimmed;
  }

  // Split evenly for single words
  const mid = Math.ceil(trimmed.length / 2);
  return (
    <>
      {trimmed.slice(0, mid)}<span>{trimmed.slice(mid)}</span>
    </>
  );
}
