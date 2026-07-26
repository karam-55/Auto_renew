import { Request } from 'express';

export interface PaginationParams {
  page: number;
  /** limit === 0 means "no limit" (return all rows) — used for lookup/reference endpoints */
  limit: number;
  skip: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Maximum allowed page size for paginated list endpoints.
 * Lookup endpoints can bypass this by passing `limit=0` (meaning "all rows").
 */
export const MAX_PAGE_LIMIT = 500;

/**
 * Default page size for list endpoints (bookings, invoices, customers, vehicles, ...).
 * Lookup/reference endpoints (services, categories, units) should pass `defaultLimit = 0`
 * so that callers receive the full dataset unless they explicitly request pagination.
 */
export const DEFAULT_PAGE_LIMIT = 20;

/**
 * Extract pagination parameters from request query.
 *
 * Behaviour:
 *  - `limit` omitted  → uses `defaultLimit` (caller-controlled; 20 for lists, 0 for lookups)
 *  - `limit=0`        → return ALL rows (skip = 0, take = undefined). Used for lookups.
 *  - `limit=N` (1..500) → normal pagination
 *  - `limit>500`      → clamped to 500 (prevents abuse)
 *
 * @param req           Express request
 * @param defaultLimit  Fallback when `limit` query param is absent.
 *                      Use `0` for lookup endpoints (services, categories, ...).
 *                      Use `20` (default) for list endpoints (bookings, invoices, ...).
 */
export function getPaginationParams(req: Request, defaultLimit: number = DEFAULT_PAGE_LIMIT): PaginationParams {
  const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);

  const rawLimit = req.query.limit as string | undefined;
  let limit: number;
  if (rawLimit === undefined || rawLimit === '') {
    limit = defaultLimit;
  } else {
    const parsed = parseInt(rawLimit, 10);
    if (isNaN(parsed) || parsed < 0) {
      limit = defaultLimit;
    } else if (parsed === 0) {
      // explicit "give me everything"
      limit = 0;
    } else {
      limit = Math.min(MAX_PAGE_LIMIT, parsed);
    }
  }

  // When limit === 0 (all rows), skip must be 0 — paging through "all" makes no sense.
  const skip = limit === 0 ? 0 : (page - 1) * limit;

  return { page, limit, skip };
}

/**
 * Create a paginated response object.
 * When `limit === 0` (all rows), `totalPages` is reported as 1 to avoid division by zero.
 */
export function createPaginatedResponse<T>(
  data: T[],
  total: number,
  page: number,
  limit: number,
): PaginatedResult<T> {
  return {
    data,
    total,
    page,
    limit,
    totalPages: limit === 0 ? 1 : Math.ceil(total / limit),
  };
}
