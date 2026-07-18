import { ApiClient, type TransportRequest } from '@/modules/http/client'
import { installApiClient } from '@/lib/http'

export function installApiClientHarness(initialData: unknown = {}) {
  const requests: TransportRequest[] = []
  let responseData = initialData
  const client = new ApiClient({
    transport: {
      async send(request) {
        requests.push(request)
        return {
          status: 200,
          headers: {},
          data: { code: 0, data: responseData, msg: 'ok' },
        }
      },
    },
    auth: {
      withAccessToken: (operation, signal) => operation(
        'test-access-token',
        signal ?? new AbortController().signal,
      ),
      refresh: async () => undefined,
    },
    requestId: () => 'test-request-id',
  })
  const uninstall = installApiClient(client)

  return {
    requests,
    respondWith(data: unknown) {
      responseData = data
    },
    uninstall,
  }
}
