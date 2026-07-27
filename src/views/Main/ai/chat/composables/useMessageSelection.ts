import { computed, shallowRef } from 'vue'
import type { Message } from './types'

export function useMessageSelection() {
  const selectionMode = shallowRef(false)
  const selected = shallowRef(new Set<number>())
  const selectedIds = computed(() => [...selected.value].sort((left, right) => left - right))

  function commit(values: Set<number>) {
    selected.value = values
  }

  function open(message: Message) {
    const values = new Set<number>([message.id])
    if (message.paired_message_id !== null) values.add(message.paired_message_id)
    selectionMode.value = true
    commit(values)
  }

  function setSelected(messageId: number, value: boolean) {
    if (!selectionMode.value) return
    const values = new Set(selected.value)
    if (value) values.add(messageId)
    else values.delete(messageId)
    commit(values)
  }

  function clear() {
    selectionMode.value = false
    commit(new Set())
  }

  return {
    selectionMode,
    selectedIds,
    open,
    setSelected,
    clear,
  }
}
