import { legacyRequest, legacyService, request, service } from './client'

export { getCommonHeaders } from './headers'
export { streamPost, type SSECallbacks } from './stream'
export { legacyRequest, legacyService, request, service }
export type { RequestConfig } from './client'
export default request
