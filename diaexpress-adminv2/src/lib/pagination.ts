import type { PaginatedParams, PaginatedResult } from '@/src/types/pagination';

export function paginateCollection<T>(
  items: T[],
  { page = 1, pageSize = 20, search }: PaginatedParams,
  searchPredicate?: (item: T, searchTerm: string) => boolean
): PaginatedResult<T> {
  const normalizedPage = page < 1 ? 1 : page;
  const normalizedSize = pageSize < 1 ? 10 : pageSize;
  const filtered =
    search && searchPredicate
      ? items.filter((item) => searchPredicate(item, search.toLowerCase()))
      : search
        ? items.filter((item) => JSON.stringify(item).toLowerCase().includes(search.toLowerCase()))
        : items;

  const startIndex = (normalizedPage - 1) * normalizedSize;
  const pagedItems = filtered.slice(startIndex, startIndex + normalizedSize);

  return {
    items: pagedItems,
    total: filtered.length,
    page: normalizedPage,
    pageSize: normalizedSize
  };
}
