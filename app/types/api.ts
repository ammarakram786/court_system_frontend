/** Pagination envelope returned by core.pagination.StandardResultsSetPagination */
export interface Paginated<T> {
  status: 'success'
  count: number
  total_pages: number
  current_page: number
  next: string | null
  previous: string | null
  results: T[]
}

/** Query params understood by every DRF list endpoint in this project */
export interface ListParams {
  page?: number
  page_size?: number
  search?: string
  ordering?: string
  [filter: string]: string | number | boolean | undefined | null
}

/** Field-level error dictionary: `{ username: ['This field is required.'] }` */
export type FieldErrors = Record<string, string[]>

/** Error envelope returned by core.exceptions.custom_exception_handler */
export interface ApiErrorBody {
  status: 'error'
  code: number
  detail: string | string[] | FieldErrors
}
