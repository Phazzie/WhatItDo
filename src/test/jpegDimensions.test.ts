import { describe, expect, it } from 'vitest'
import { jpegDimensions } from './jpegDimensions'

describe('jpegDimensions', () => {
  it('rejects malformed JPEG data', () => {
    expect(() => jpegDimensions(Buffer.from([]))).toThrow('Malformed JPEG: missing SOI marker')
    expect(() => jpegDimensions(Buffer.from([0xff, 0xd8, 0x00, 0x00]))).toThrow(
      'Malformed JPEG: expected marker'
    )
    expect(() => jpegDimensions(Buffer.from([0xff, 0xd8, 0xff, 0xff]))).toThrow(
      'Malformed JPEG: incomplete marker'
    )
    expect(() => jpegDimensions(Buffer.from([0xff, 0xd8, 0xff, 0xe0]))).toThrow(
      'Malformed JPEG: incomplete segment'
    )
    expect(() => jpegDimensions(Buffer.from([0xff, 0xd8, 0xff, 0xc0, 0x00, 0x08, 0x08]))).toThrow(
      'Malformed JPEG: invalid segment length'
    )
    expect(() => jpegDimensions(Buffer.from([0xff, 0xd8, 0xff, 0xc0, 0x00, 0x02]))).toThrow(
      'Malformed JPEG: incomplete SOF segment'
    )
  })

  it('rejects JPEG data without a start-of-frame marker', () => {
    expect(() => jpegDimensions(Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x02, 0xff, 0xd9]))).toThrow(
      'Malformed JPEG: no SOF marker'
    )
  })
})
