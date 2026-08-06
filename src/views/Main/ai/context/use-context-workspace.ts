import { computed, onMounted, readonly, ref, shallowRef, watch } from 'vue'
import { ElNotification } from 'element-plus'
import {
  AiContextApi,
  type AiContextDocument,
  type AiContextDocumentVersion,
  type AiContextEvaluation,
  type AiContextPageInit,
  type AiContextProfile,
  type AiContextSpace,
} from '@/api/ai/context'
import { isApiError } from '@/modules/http/error'

export type ContextWorkspaceTab = 'spaces' | 'documents' | 'profiles' | 'evaluation'

export function useContextWorkspace() {
  const activeTab = shallowRef<ContextWorkspaceTab>('spaces')
  const profiles = ref<AiContextProfile[]>([])
  const embeddingModelOptions = ref<AiContextPageInit['embedding_model_options']>([])
  const memoryModelOptions = ref<AiContextPageInit['memory_model_options']>([])
  const rerankerModelOptions = ref<AiContextPageInit['reranker_model_options']>([])
  const spaces = ref<AiContextSpace[]>([])
  const documents = ref<AiContextDocument[]>([])
  const versions = ref<AiContextDocumentVersion[]>([])
  const evaluation = shallowRef<AiContextEvaluation | null>(null)
  const selectedProfileID = shallowRef<number | null>(null)
  const selectedSpaceID = shallowRef<number | null>(null)
  const selectedDocumentID = shallowRef<number | null>(null)
  const profilesLoading = shallowRef(false)
  const spacesLoading = shallowRef(false)
  const documentsLoading = shallowRef(false)
  const versionsLoading = shallowRef(false)
  const evaluationLoading = shallowRef(false)

  const selectedProfile = computed(() => (
    profiles.value.find(item => item.id === selectedProfileID.value) ?? null
  ))
  const selectedSpace = computed(() => (
    spaces.value.find(item => item.id === selectedSpaceID.value) ?? null
  ))
  const selectedDocument = computed(() => (
    documents.value.find(item => item.id === selectedDocumentID.value) ?? null
  ))

  let profileRequest: AbortController | null = null
  let spaceRequest: AbortController | null = null
  let documentRequest: AbortController | null = null

  async function loadPageInit() {
    const response = await AiContextApi.pageInit()
    embeddingModelOptions.value = response.embedding_model_options
    memoryModelOptions.value = response.memory_model_options
    rerankerModelOptions.value = response.reranker_model_options
  }

  async function refreshProfiles() {
    profileRequest?.abort()
    profileRequest = new AbortController()
    profilesLoading.value = true
    try {
      const response = await AiContextApi.profiles.list({}, { signal: profileRequest.signal })
      profiles.value = response.items
      if (!response.items.some(item => item.id === selectedProfileID.value)) {
        selectedProfileID.value = response.items[0]?.id ?? null
      }
    } finally {
      profilesLoading.value = false
    }
  }

  async function refreshSpaces() {
    spaceRequest?.abort()
    spaces.value = []
    selectedSpaceID.value = null
    const profileID = selectedProfileID.value
    if (profileID === null) return
    spaceRequest = new AbortController()
    spacesLoading.value = true
    try {
      const response = await AiContextApi.spaces.list(
        { profile_id: profileID },
        { signal: spaceRequest.signal },
      )
      spaces.value = response.items
      selectedSpaceID.value = response.items[0]?.id ?? null
    } finally {
      spacesLoading.value = false
    }
  }

  async function refreshDocuments() {
    documentRequest?.abort()
    documents.value = []
    selectedDocumentID.value = null
    versions.value = []
    const spaceID = selectedSpaceID.value
    if (spaceID === null) return
    documentRequest = new AbortController()
    documentsLoading.value = true
    try {
      const response = await AiContextApi.documents.list(
        { space_id: spaceID },
        { signal: documentRequest.signal },
      )
      documents.value = response.items
      selectedDocumentID.value = response.items[0]?.id ?? null
    } finally {
      documentsLoading.value = false
    }
  }

  async function refreshVersions() {
    const documentID = selectedDocumentID.value
    versions.value = []
    if (documentID === null) return
    versionsLoading.value = true
    try {
      versions.value = (await AiContextApi.documents.versions(documentID)).items
    } finally {
      versionsLoading.value = false
    }
  }

  async function runEvaluation(agentID: number, query: string) {
    evaluationLoading.value = true
    evaluation.value = null
    try {
      evaluation.value = await AiContextApi.evaluations.run({ agent_id: agentID, query })
    } catch (error: unknown) {
      if (isApiError(error) && error.kind === 'canceled') return
      if (!(error instanceof Error) || error.message.trim() === '') {
        throw error
      }
      ElNotification.error({ message: error.message })
    } finally {
      evaluationLoading.value = false
    }
  }

  async function initialize() {
    await Promise.all([loadPageInit(), refreshProfiles()])
  }

  watch(selectedProfileID, () => void refreshSpaces())
  watch(selectedSpaceID, () => void refreshDocuments())
  watch(selectedDocumentID, () => void refreshVersions())
  onMounted(() => void initialize())

  return {
    activeTab,
    profiles: readonly(profiles),
    embeddingModelOptions: readonly(embeddingModelOptions),
    memoryModelOptions: readonly(memoryModelOptions),
    rerankerModelOptions: readonly(rerankerModelOptions),
    spaces: readonly(spaces),
    documents: readonly(documents),
    versions: readonly(versions),
    evaluation,
    selectedProfileID,
    selectedSpaceID,
    selectedDocumentID,
    selectedProfile,
    selectedSpace,
    selectedDocument,
    profilesLoading: readonly(profilesLoading),
    spacesLoading: readonly(spacesLoading),
    documentsLoading: readonly(documentsLoading),
    versionsLoading: readonly(versionsLoading),
    evaluationLoading: readonly(evaluationLoading),
    refreshProfiles,
    refreshSpaces,
    refreshDocuments,
    refreshVersions,
    runEvaluation,
  }
}
