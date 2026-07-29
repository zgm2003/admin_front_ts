import type { AiAgentEffectiveCapabilities } from '@/api/ai/agents'

export interface ComposerCapabilityState {
  images: Array<{ id: string; mimeType: string; size: number }>
  temperatureEnabled: boolean
}

export interface CapabilityConflicts {
  invalidImageIds: string[]
  temperature: boolean
}

export function detectCapabilityConflicts(
  state: ComposerCapabilityState,
  target: AiAgentEffectiveCapabilities,
): CapabilityConflicts {
  const image = target.attachments.image
  const validMIMEs = new Set(image.mime_types)
  const invalidImageIds: string[] = []
  let validImages = 0
  for (const item of state.images) {
    const invalid = !image.enabled
      || !validMIMEs.has(item.mimeType)
      || item.size > image.max_file_bytes
      || validImages >= image.max_files
    if (invalid) invalidImageIds.push(item.id)
    else validImages += 1
  }
  return {
    invalidImageIds,
    temperature: state.temperatureEnabled
      && !target.runtime_parameters.temperature.supported,
  }
}

export async function prepareCapabilityTransition(input: {
  state: ComposerCapabilityState
  target: AiAgentEffectiveCapabilities
  confirm: (conflicts: CapabilityConflicts) => Promise<void>
  clear: (conflicts: CapabilityConflicts) => void
}): Promise<boolean> {
  const conflicts = detectCapabilityConflicts(input.state, input.target)
  if (conflicts.invalidImageIds.length === 0 && !conflicts.temperature) return true
  try {
    await input.confirm(conflicts)
  } catch {
    return false
  }
  input.clear(conflicts)
  return true
}
