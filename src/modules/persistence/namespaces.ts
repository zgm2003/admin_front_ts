export type DeviceNamespace = 'admin:1:device'
export type UserNamespace = `admin:1:user:${string}`
export type Namespace = DeviceNamespace | UserNamespace

export const deviceNamespace: DeviceNamespace = 'admin:1:device'

export function userNamespace(identity: string | number): UserNamespace {
  const segment = String(identity)
  if (!/^[A-Za-z0-9._-]+$/.test(segment)) {
    throw new TypeError('user persistence identity must be one safe namespace segment')
  }
  return `admin:1:user:${segment}`
}
