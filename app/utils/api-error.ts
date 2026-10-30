import type { ApiErrorBody, FieldErrors } from '~/types/api'

/** Normalised error thrown by `useApi` for every failed request. */
export class ApiError extends Error {
  readonly status: number
  /** Field-level errors keyed by serializer field name */
  readonly fields: FieldErrors
  /** Non-field errors (strings) */
  readonly messages: string[]

  constructor(status: number, message: string, fields: FieldErrors = {}, messages: string[] = []) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.fields = fields
    this.messages = messages
  }

  get isValidation() {
    return this.status === 400 && Object.keys(this.fields).length > 0
  }
}

const toArray = (v: unknown): string[] =>
  Array.isArray(v) ? v.flatMap(toArray) : typeof v === 'string' ? [v] : v && typeof v === 'object' ? Object.values(v).flatMap(toArray) : []

/** Convert whatever DRF / our exception handler / simplejwt returned into an ApiError. */
export function toApiError(status: number | undefined, data: unknown, fallback = 'Something went wrong'): ApiError {
  const code = status ?? 0
  if (!data || typeof data !== 'object') {
    return new ApiError(code, code === 0 ? 'Unable to reach the server' : fallback)
  }

  // Our envelope: { status: 'error', code, detail }; simplejwt returns { detail } or raw dict
  const body = data as Partial<ApiErrorBody> & Record<string, unknown>
  const detail = 'detail' in body ? body.detail : body

  const fields: FieldErrors = {}
  const messages: string[] = []

  if (typeof detail === 'string') {
    messages.push(detail)
  } else if (Array.isArray(detail)) {
    messages.push(...toArray(detail))
  } else if (detail && typeof detail === 'object') {
    for (const [key, value] of Object.entries(detail)) {
      if (key === 'non_field_errors' || key === 'detail') messages.push(...toArray(value))
      else fields[key] = toArray(value)
    }
  }

  const message = messages[0] ?? Object.values(fields)[0]?.[0] ?? fallback
  return new ApiError(code, message, fields, messages)
}
