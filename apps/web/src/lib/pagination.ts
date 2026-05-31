// Pagination utilities — supports both offset-based and cursor-based pagination

export interface OffsetPage {
  page: number;
  pageSize: number;
  total: number;
}

export interface PageMeta extends OffsetPage {
  totalPages: number;
  hasPrev: boolean;
  hasNext: boolean;
  from: number;
  to: number;
}

export function buildPageMeta(opts: OffsetPage): PageMeta {
  const { page, pageSize, total } = opts;
  const totalPages = pageSize > 0 ? Math.ceil(total / pageSize) : 0;
  return {
    page,
    pageSize,
    total,
    totalPages,
    hasPrev: page > 1,
    hasNext: page < totalPages,
    from: Math.min(total, (page - 1) * pageSize + 1),
    to: Math.min(total, page * pageSize),
  };
}

export function parsePage(raw: string | undefined | null, defaultPage = 1): number {
  const n = parseInt(raw ?? "", 10);
  return isNaN(n) || n < 1 ? defaultPage : n;
}

export function parsePageSize(raw: string | undefined | null, defaultSize = 20, max = 100): number {
  const n = parseInt(raw ?? "", 10);
  if (isNaN(n) || n < 1) return defaultSize;
  return Math.min(n, max);
}

export interface CursorPage<T> {
  items: T[];
  nextCursor: string | null;
  hasMore: boolean;
}

export function buildCursorPage<T extends { id: string }>(
  items: T[],
  limit: number
): CursorPage<T> {
  const hasMore = items.length > limit;
  const data = hasMore ? items.slice(0, limit) : items;
  return {
    items: data,
    nextCursor: hasMore ? data[data.length - 1].id : null,
    hasMore,
  };
}
