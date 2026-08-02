// Shared categorical/status color constants.
// These were previously duplicated verbatim across many pages — consolidating
// them here means a future palette change (e.g. a new brand accent system)
// is a one-file edit instead of hunting down every copy.

// Used for genre/tag/theme chips and pie-chart slices where each item needs
// a distinct, stable color. Order matters — components index into this array.
export const CATEGORY_COLORS = [
  '#8B5CF6', '#22C55E', '#EF4444', '#3B82F6', '#FFB84D', '#C6409A', '#14B8A6',
];

// Same idea, one extra color — used by the handful of charts that show up
// to 8 categories (pie charts in Author/Dashboard/Stats/Journey).
export const PIE_COLORS = [
  '#8B5CF6', '#22C55E', '#3B82F6', '#FFB84D', '#EF4444', '#14B8A6', '#C6409A', '#84CC16',
];

// Fixed mapping for reading status — same 4 states everywhere, so the
// color for "reading" should never drift between pages.
export const STATUS_COLORS: Record<string, string> = {
  finished: '#22C55E',
  reading: '#3B82F6',
  planned: '#9898B0',
  abandoned: '#EF4444',
};
