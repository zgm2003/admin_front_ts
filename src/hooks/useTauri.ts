/**
 * Tauri 环境检测 Hook
 */

const getTauri = () => (window as any).__TAURI__

/** 是否在 Tauri 环境 */
export const isTauri = () => !!getTauri()

/** 获取 Tauri API 对象 */
export const useTauri = () => getTauri()
