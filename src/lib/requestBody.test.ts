import { describe, expect, it } from 'vitest'
import { NextRequest } from 'next/server'
import { MAX_REQUEST_BODY_BYTES, readJsonBody } from './requestBody'

function request(body: BodyInit, headers?: HeadersInit) {
  return new NextRequest('http://localhost/api/test', {
    method: 'POST',
    body,
    headers: { 'content-type': 'application/json', ...headers },
  })
}

describe('readJsonBody', () => {
  it('accepts valid JSON at the exact byte limit', async () => {
    const prefix = '{"value":"'
    const suffix = '"}'
    const body = `${prefix}${'a'.repeat(MAX_REQUEST_BODY_BYTES - prefix.length - suffix.length)}${suffix}`
    expect(new TextEncoder().encode(body)).toHaveLength(MAX_REQUEST_BODY_BYTES)
    expect(await readJsonBody(request(body))).toMatchObject({ ok: true })
  })

  it('rejects declared and streamed bodies above 16 KiB with 413', async () => {
    expect(await readJsonBody(request('{}', { 'content-length': String(MAX_REQUEST_BODY_BYTES + 1) }))).toMatchObject({ ok: false, status: 413 })
    expect(await readJsonBody(request('x'.repeat(MAX_REQUEST_BODY_BYTES + 1)))).toMatchObject({ ok: false, status: 413 })
  })

  it('rejects malformed JSON and malformed UTF-8 with 400', async () => {
    expect(await readJsonBody(request('{nope'))).toMatchObject({ ok: false, status: 400 })
    expect(await readJsonBody(request(new Uint8Array([0xc3, 0x28])))).toMatchObject({ ok: false, status: 400 })
  })

  it('requires the JSON media type while allowing a charset parameter', async () => {
    expect(await readJsonBody(request('{}', { 'content-type': 'application/json; charset=utf-8' }))).toMatchObject({ ok: true })
    expect(await readJsonBody(request('{}', { 'content-type': 'text/plain' }))).toEqual({
      ok: false,
      status: 415,
      error: 'Content-Type must be application/json',
    })
    const missing = new NextRequest('http://localhost/api/test', {
      method: 'POST',
      body: new Uint8Array([123, 125]),
    })
    expect(await readJsonBody(missing)).toMatchObject({ ok: false, status: 415 })
  })
})
