import type { adminOperations as generatedAdminOperations } from './generated/operations'

type AdminOperations = typeof generatedAdminOperations

let operationsPromise: Promise<AdminOperations> | undefined

function loadAdminOperations(): Promise<AdminOperations> {
  operationsPromise ??= import('./generated/operations').then(({ adminOperations }) => adminOperations)
  return operationsPromise
}

export async function loadAdminOperation<K extends keyof AdminOperations>(
  operationID: K,
): Promise<AdminOperations[K]> {
  const operations = await loadAdminOperations()
  return operations[operationID]
}
