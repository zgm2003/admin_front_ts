import { effectScope } from 'vue'
import { describe, expect, it, vi } from 'vitest'
import { useResourceQuery } from '@/modules/resource-query/vue'

const options = () => ({
  request: vi.fn(async () => ({ items: [] as number[] })),
  selectItems: (page: { items: number[] }) => page.items,
})

describe('useResourceQuery', () => {
  it('works without an active Vue scope', async () => {
    const query = useResourceQuery(options())
    await expect(query.execute(undefined)).resolves.toEqual({ items: [] })
    query.dispose()
  })

  it('disposes the query with its owning Vue scope', async () => {
    const scope = effectScope()
    const query = scope.run(() => useResourceQuery(options()))!
    scope.stop()

    await expect(query.execute(undefined)).rejects.toThrow(/disposed/i)
  })
})
