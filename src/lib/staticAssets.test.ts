import { readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const SOF_MARKERS = new Set([
  0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf,
])
const BACKDROP_PATH = join(process.cwd(), 'public', 'whatitdo-backdrop.jpg')

function jpegDimensions(data: Buffer) {
  if (data.length < 4 || data[0] !== 0xff || data[1] !== 0xd8) {
    throw new Error('Malformed JPEG: missing SOI marker')
  }

  let offset = 2
  while (offset < data.length) {
    if (data[offset] !== 0xff) throw new Error('Malformed JPEG: expected marker')
    while (data[offset] === 0xff) offset += 1
    if (offset >= data.length) throw new Error('Malformed JPEG: incomplete marker')

    const marker = data[offset]
    offset += 1
    if (marker === 0xd8 || marker === 0xd9 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
      continue
    }
    if (offset + 2 > data.length) throw new Error('Malformed JPEG: incomplete segment')

    const segmentLength = data.readUInt16BE(offset)
    if (segmentLength < 2 || offset + segmentLength > data.length) {
      throw new Error('Malformed JPEG: invalid segment length')
    }
    if (SOF_MARKERS.has(marker)) {
      if (segmentLength < 8) throw new Error('Malformed JPEG: incomplete SOF segment')
      return {
        height: data.readUInt16BE(offset + 3),
        width: data.readUInt16BE(offset + 5),
      }
    }

    offset += segmentLength
  }

  throw new Error('Malformed JPEG: no SOF marker')
}

describe('static asset regressions', () => {
  it('rejects malformed JPEG data and data without a SOF marker', () => {
    expect(() => jpegDimensions(Buffer.from([0xff, 0xd8, 0xff, 0xc0, 0x00, 0x08, 0x08]))).toThrow(
      'Malformed JPEG: invalid segment length'
    )
    expect(() => jpegDimensions(Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x02, 0xff, 0xd9]))).toThrow(
      'Malformed JPEG: no SOF marker'
    )
  })

  it('keeps the backdrop a bounded 1672x941 JPEG', () => {
    const backdrop = readFileSync(BACKDROP_PATH)

    expect(backdrop.subarray(0, 2)).toEqual(Buffer.from([0xff, 0xd8]))
    expect(jpegDimensions(backdrop)).toEqual({ width: 1672, height: 941 })
    expect(statSync(BACKDROP_PATH).size).toBeLessThanOrEqual(600_000)
  })
})
