import { getUploadToken, uploadFileToCloud, validateFile } from '@/lib/upload'
import { executeAdminOperation } from '@/lib/http'
import type { ExecuteOptions } from '@/modules/http/client'
import {
  adminOperations,
  type AdminOperationInput,
  type AdminOperationOutput,
} from '@/modules/http/generated/operations'

type Input<K extends keyof typeof adminOperations> = AdminOperationInput<K>
type Output<K extends keyof typeof adminOperations> = AdminOperationOutput<K>

export type AiContextProfile = Output<'ai_context_profile_get'>
export type AiContextSpace = Output<'ai_context_space_get'>
export type AiContextDocument = Output<'ai_context_document_get'>
export type AiContextDocumentVersion = Output<'ai_context_document_versions_list'>['items'][number]
export type AiContextEvaluation = Output<'ai_context_evaluate'>
export type AiAgentContextProfile = Output<'ai_agent_context_profile_get'>
export type AiAgentContextSpaces = Output<'ai_agent_context_spaces_get'>
export type AiContextPageInit = Output<'ai_context_page_init'>

export type AiContextProfileCreateBody = Input<'ai_context_profile_create'>['body']
export type AiContextProfileUpdateBody = Input<'ai_context_profile_update_metadata'>['body']
export type AiContextSpaceMutationBody = Input<'ai_context_space_create'>['body']
export type AiContextDocumentCreateBody = Input<'ai_context_document_create'>['body']
export type AiContextDocumentVersionCreateBody = Input<'ai_context_document_version_create'>['body']

function positiveID(value: number, label: string): number {
  if (!Number.isSafeInteger(value) || value <= 0) {
    throw new Error(`${label} must be a positive integer`)
  }
  return value
}

function listProfiles(
  query: Input<'ai_context_profiles_list'>['query'] = {},
  options: ExecuteOptions = {},
) {
  return executeAdminOperation(adminOperations.ai_context_profiles_list, { query }, options)
}

function pageInit(options: ExecuteOptions = {}): Promise<AiContextPageInit> {
  return executeAdminOperation(adminOperations.ai_context_page_init, {}, options)
}

function listSpaces(
  query: Input<'ai_context_spaces_list'>['query'] = {},
  options: ExecuteOptions = {},
) {
  return executeAdminOperation(adminOperations.ai_context_spaces_list, { query }, options)
}

function listDocuments(
  params: { space_id: number; status?: NonNullable<Input<'ai_context_space_documents_list'>['query']>['status'] },
  options: ExecuteOptions = {},
) {
  const query: NonNullable<Input<'ai_context_space_documents_list'>['query']> = {}
  if (params.status !== undefined) query.status = params.status
  return executeAdminOperation(adminOperations.ai_context_space_documents_list, {
    path: { id: positiveID(params.space_id, 'Context space id') },
    query,
  }, options)
}

async function remove(
  operation: typeof adminOperations.ai_context_space_delete | typeof adminOperations.ai_context_document_delete,
  id: number,
  label: string,
  options: ExecuteOptions,
): Promise<void> {
  await executeAdminOperation(operation, { path: { id: positiveID(id, label) } }, options)
}

export async function uploadAiContextDocument(file: File): Promise<AiContextDocumentVersionCreateBody> {
  const token = await getUploadToken({
    folder: 'ai_context_documents',
    file_name: file.name,
    file_size: file.size,
    file_kind: 'file',
  })
  validateFile(file, token, 'file')
  const uploaded = await uploadFileToCloud(file, token)
  if (!uploaded.etag) {
    throw new Error('Context document upload completed without an ETag')
  }
  return {
    source_storage_provider: 'cos',
    source_object_key: uploaded.key,
    source_etag: uploaded.etag,
    source_size_bytes: file.size,
    source_filename: file.name,
  }
}

export const AiContextApi = {
  pageInit,
  profiles: {
    list: listProfiles,
    detail: (id: number, options: ExecuteOptions = {}) => executeAdminOperation(
      adminOperations.ai_context_profile_get,
      { path: { id: positiveID(id, 'Context profile id') } },
      options,
    ),
    create: (body: AiContextProfileCreateBody, options: ExecuteOptions = {}) => executeAdminOperation(
      adminOperations.ai_context_profile_create,
      { body },
      options,
    ),
    update: (id: number, body: AiContextProfileUpdateBody, options: ExecuteOptions = {}) => executeAdminOperation(
      adminOperations.ai_context_profile_update_metadata,
      { path: { id: positiveID(id, 'Context profile id') }, body },
      options,
    ),
    changeStatus: (
      id: number,
      status: Input<'ai_context_profile_change_status'>['body']['status'],
      options: ExecuteOptions = {},
    ) => executeAdminOperation(adminOperations.ai_context_profile_change_status, {
      path: { id: positiveID(id, 'Context profile id') },
      body: { status },
    }, options),
  },
  spaces: {
    list: listSpaces,
    detail: (id: number, options: ExecuteOptions = {}) => executeAdminOperation(
      adminOperations.ai_context_space_get,
      { path: { id: positiveID(id, 'Context space id') } },
      options,
    ),
    create: (body: AiContextSpaceMutationBody, options: ExecuteOptions = {}) => executeAdminOperation(
      adminOperations.ai_context_space_create,
      { body },
      options,
    ),
    update: (id: number, body: AiContextSpaceMutationBody, options: ExecuteOptions = {}) => executeAdminOperation(
      adminOperations.ai_context_space_update,
      { path: { id: positiveID(id, 'Context space id') }, body },
      options,
    ),
    changeStatus: (
      id: number,
      status: Input<'ai_context_space_change_status'>['body']['status'],
      options: ExecuteOptions = {},
    ) => executeAdminOperation(adminOperations.ai_context_space_change_status, {
      path: { id: positiveID(id, 'Context space id') },
      body: { status },
    }, options),
    remove: (id: number, options: ExecuteOptions = {}) => remove(
      adminOperations.ai_context_space_delete,
      id,
      'Context space id',
      options,
    ),
  },
  documents: {
    list: listDocuments,
    detail: (id: number, options: ExecuteOptions = {}) => executeAdminOperation(
      adminOperations.ai_context_document_get,
      { path: { id: positiveID(id, 'Context document id') } },
      options,
    ),
    versions: (id: number, options: ExecuteOptions = {}) => executeAdminOperation(
      adminOperations.ai_context_document_versions_list,
      { path: { id: positiveID(id, 'Context document id') } },
      options,
    ),
    create: (spaceID: number, body: AiContextDocumentCreateBody, options: ExecuteOptions = {}) => executeAdminOperation(
      adminOperations.ai_context_document_create,
      { path: { id: positiveID(spaceID, 'Context space id') }, body },
      options,
    ),
    createVersion: (
      documentID: number,
      body: AiContextDocumentVersionCreateBody,
      options: ExecuteOptions = {},
    ) => executeAdminOperation(adminOperations.ai_context_document_version_create, {
      path: { id: positiveID(documentID, 'Context document id') },
      body,
    }, options),
    changeStatus: (
      id: number,
      status: Input<'ai_context_document_change_status'>['body']['status'],
      options: ExecuteOptions = {},
    ) => executeAdminOperation(adminOperations.ai_context_document_change_status, {
      path: { id: positiveID(id, 'Context document id') },
      body: { status },
    }, options),
    remove: (id: number, options: ExecuteOptions = {}) => remove(
      adminOperations.ai_context_document_delete,
      id,
      'Context document id',
      options,
    ),
    reindex: (id: number, options: ExecuteOptions = {}) => executeAdminOperation(
      adminOperations.ai_context_document_reindex,
      { path: { id: positiveID(id, 'Context document id') } },
      options,
    ),
  },
  evaluations: {
    run: (body: Input<'ai_context_evaluate'>['body'], options: ExecuteOptions = {}) => executeAdminOperation(
      adminOperations.ai_context_evaluate,
      { body: { agent_id: positiveID(body.agent_id, 'AI agent id'), query: body.query } },
      options,
    ),
  },
  agents: {
    profile: (agentID: number, options: ExecuteOptions = {}) => executeAdminOperation(
      adminOperations.ai_agent_context_profile_get,
      { path: { id: positiveID(agentID, 'AI agent id') } },
      options,
    ),
    updateProfile: (agentID: number, profileID: number | null, options: ExecuteOptions = {}) => executeAdminOperation(
      adminOperations.ai_agent_context_profile_update,
      {
        path: { id: positiveID(agentID, 'AI agent id') },
        body: { profile_id: profileID === null ? null : positiveID(profileID, 'Context profile id') },
      },
      options,
    ),
    spaces: (agentID: number, options: ExecuteOptions = {}) => executeAdminOperation(
      adminOperations.ai_agent_context_spaces_get,
      { path: { id: positiveID(agentID, 'AI agent id') } },
      options,
    ),
    updateSpaces: (agentID: number, spaceIDs: number[], options: ExecuteOptions = {}) => executeAdminOperation(
      adminOperations.ai_agent_context_spaces_update,
      {
        path: { id: positiveID(agentID, 'AI agent id') },
        body: { space_ids: [...new Set(spaceIDs.map(id => positiveID(id, 'Context space id')))] },
      },
      options,
    ),
  },
} as const
