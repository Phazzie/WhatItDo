import { readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { expect, test } from 'vitest'
import { jpegDimensions } from '@/test/jpegDimensions'

const BACKDROP_PATH = join(process.cwd(), 'public', 'whatitdo-backdrop.jpg')

test('keeps the backdrop a bounded 1672x941 JPEG', () => {
  const backdrop = readFileSync(BACKDROP_PATH)

  expect(backdrop.subarray(0, 2)).toEqual(Buffer.from([0xff, 0xd8]))
  expect(jpegDimensions(backdrop)).toEqual({ width: 1672, height: 941 })
  expect(statSync(BACKDROP_PATH).size).toBeLessThanOrEqual(600_000)
})
