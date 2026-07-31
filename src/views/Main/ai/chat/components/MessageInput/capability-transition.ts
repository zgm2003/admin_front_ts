import type { AiAgentEffectiveCapabilities } from '@/api/ai/agents'

export interface ComposerCapabilityState {
  attachments: Array<{
    id: string
    kind: 'image' | 'file'
    name: string
    mimeType: string
    size: number
  }>
  temperatureEnabled: boolean
}

export interface CapabilityConflicts {
  incompatibleAttachmentIds: string[]
  temperature: boolean
}

function extension(name: string) {
  const index = name.lastIndexOf('.')
  return index > -1 ? name.slice(index + 1).toLowerCase() : ''
}

export function detectCapabilityConflicts(
  state: ComposerCapabilityState,
  target: AiAgentEffectiveCapabilities,
): CapabilityConflicts {
  const capabilities = target.attachments
  const validMIMEs = new Set(capabilities.image.mime_types)
  const validFileExtensions = new Set(capabilities.native_file.accepted_extensions)
  const incompatibleAttachmentIds: string[] = []
  let validImages = 0
  let validNativeFiles = 0
  let validCount = 0
  let totalBytes = 0
  for (const item of state.attachments) {
    const exceedsSharedLimit = validCount >= capabilities.max_attachments_per_message
      || item.size > capabilities.max_message_attachment_bytes - totalBytes
    const invalid = item.kind === 'image'
      ? !capabilities.image.enabled
        || !validMIMEs.has(item.mimeType)
        || item.size > capabilities.image.max_file_bytes
        || validImages >= capabilities.image.max_files
        || exceedsSharedLimit
      : !capabilities.native_file.enabled
        || !validFileExtensions.has(extension(item.name))
        || item.size >= capabilities.native_file.max_file_bytes_exclusive
        || validNativeFiles >= capabilities.native_file.max_files_per_message
        || exceedsSharedLimit
    if (invalid) {
      incompatibleAttachmentIds.push(item.id)
      continue
    }
    validCount += 1
    totalBytes += item.size
    if (item.kind === 'image') validImages += 1
    else validNativeFiles += 1
  }
  return {
    incompatibleAttachmentIds,
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
  if (conflicts.incompatibleAttachmentIds.length === 0 && !conflicts.temperature) return true
  try {
    await input.confirm(conflicts)
  } catch {
    return false
  }
  input.clear(conflicts)
  return true
}
