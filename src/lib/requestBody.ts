import type { NextRequest } from 'next/server'

export const MAX_REQUEST_BODY_BYTES = 16 * 1024

export type JsonBodyResult =
  | { ok: true; value: unknown }
  | { ok: false; status: 400 | 413 | 415; error: string }

export async function readJsonBody(
  request: NextRequest,
  maxBytes = MAX_REQUEST_BODY_BYTES
): Promise<JsonBodyResult> {
  const contentType = request.headers.get('content-type')
  const mediaType = contentType?.split(';', 1)[0]?.trim().toLowerCase()
  if (mediaType !== 'application/json') {
    return { ok: false, status: 415, error: 'Content-Type must be application/json' }
  }

  const declaredLength = request.headers.get('content-length')
  if (declaredLength && Number(declaredLength) > maxBytes) {
    return { ok: false, status: 413, error: 'Request body too large' }
  }

  const reader = request.body?.getReader()
  if (!reader) return { ok: false, status: 400, error: 'Invalid JSON body' }

  const chunks: Uint8Array[] = []
  let size = 0
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    size += value.byteLength
    if (size > maxBytes) {
      await reader.cancel()
      return { ok: false, status: 413, error: 'Request body too large' }
    }
    chunks.push(value)
  }

  const bytes = new Uint8Array(size)
  let offset = 0
  for (const chunk of chunks) {
    bytes.set(chunk, offset)
    offset += chunk.byteLength
  }

  try {
    const text = new TextDecoder('utf-8', { fatal: true }).decode(bytes)
    return { ok: true, value: JSON.parse(text) as unknown }
  } catch {
    return { ok: false, status: 400, error: 'Invalid JSON body' }
  }
}
