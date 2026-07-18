import type { RouteRecordName, RouteRecordRaw } from 'vue-router'
import type { PermissionCode } from './generated/permissions'
import type { BackendViewKey } from './generated/views'
import type { LocalViewLoader } from './generated/local-views'
import { validatedRelativeRedirect } from './guards'
import {
  validateRuntimeRouteSet,
  type QuarantinedRuntimeRoute,
  type RuntimeRoute,
} from './contracts'

export interface RuntimeRouteRouter {
  addRoute(parentName: RouteRecordName, route: RouteRecordRaw): () => void
  replace(path: string): Promise<unknown>
}

export interface RuntimeRouteTab {
  readonly routeName: string
  readonly path: string
  readonly menuId: string
}

export interface RuntimeRouteUiSnapshot {
  readonly tabs: readonly RuntimeRouteTab[]
  readonly selectedMenuId: string
  readonly lastRoute: string | null
}

export interface RuntimeRouteUiState {
  snapshot(): RuntimeRouteUiSnapshot
  replace(value: RuntimeRouteUiSnapshot): void
}

export interface RuntimeRouteRegistryOptions {
  readonly router: RuntimeRouteRouter
  readonly views: Partial<Record<BackendViewKey, LocalViewLoader>>
  readonly uiState: RuntimeRouteUiState
  readonly rootRouteName: RouteRecordName
}

export interface RuntimeRouteInstallOptions {
  readonly requestedPath?: string | null
}

export interface RuntimeRouteInstallResult {
  readonly installed: readonly RuntimeRoute[]
  readonly denied: readonly RuntimeRoute[]
  readonly quarantined: readonly QuarantinedRuntimeRoute[]
  readonly restorePath: string
}

interface PlannedRoute {
  readonly contract: RuntimeRoute
  readonly record: RouteRecordRaw
}

function orderParentsFirst(routes: readonly RuntimeRoute[]): readonly RuntimeRoute[] {
  const byName = new Map(routes.map((route) => [route.name as string, route]))
  const ordered: RuntimeRoute[] = []
  const visited = new Set<string>()
  const visit = (route: RuntimeRoute) => {
    if (visited.has(route.name)) return
    const parent = route.parentName ? byName.get(route.parentName) : undefined
    if (parent) visit(parent)
    visited.add(route.name)
    ordered.push(route)
  }
  for (const route of routes) visit(route)
  return ordered
}

function applicationPath(value: string | null | undefined): string | null {
  if (!value) return null
  const validated = validatedRelativeRedirect(value)
  if (!validated) return null
  return new URL(validated, 'https://admin.invalid').pathname
}

export class RuntimeRouteRegistry {
  private readonly router: RuntimeRouteRouter
  private readonly views: Partial<Record<BackendViewKey, LocalViewLoader>>
  private readonly uiState: RuntimeRouteUiState
  private readonly rootRouteName: RouteRecordName
  private installedPlan: readonly PlannedRoute[] = []
  private removers: Array<() => void> = []

  constructor(options: RuntimeRouteRegistryOptions) {
    this.router = options.router
    this.views = options.views
    this.uiState = options.uiState
    this.rootRouteName = options.rootRouteName
  }

  async install(
    input: readonly unknown[],
    permissions: ReadonlySet<PermissionCode>,
    options: RuntimeRouteInstallOptions = {},
  ): Promise<RuntimeRouteInstallResult> {
    const validation = validateRuntimeRouteSet(input)
    const quarantined = [...validation.quarantined]
    const denied: RuntimeRoute[] = []
    const planned: PlannedRoute[] = []
    const plannedNames = new Set<string>()
    const deniedNames = new Set<string>()
    const inputIndexByName = new Map<string, number>()
    input.forEach((value, index) => {
      if (typeof value === 'object' && value !== null && 'name' in value && typeof value.name === 'string') {
        if (!inputIndexByName.has(value.name)) inputIndexByName.set(value.name, index)
      }
    })

    for (const route of orderParentsFirst(validation.valid)) {
      if (route.parentName && !plannedNames.has(route.parentName)) {
        if (deniedNames.has(route.parentName)) {
          denied.push(route)
          deniedNames.add(route.name)
        } else {
          quarantined.push({
            index: inputIndexByName.get(route.name) ?? -1,
            name: route.name,
            reason: 'missing-parent',
          })
        }
        continue
      }
      const component = this.views[route.viewKey]
      if (!component) {
        quarantined.push({
          index: inputIndexByName.get(route.name) ?? -1,
          name: route.name,
          reason: 'unknown-local-view',
        })
        continue
      }
      if (route.permission && !permissions.has(route.permission)) {
        denied.push(route)
        deniedNames.add(route.name)
        continue
      }
      planned.push({
        contract: route,
        record: {
          name: route.name,
          path: route.path,
          component,
          meta: {
            menuId: route.menuId,
            titleKey: route.meta.titleKey,
            showMenu: route.meta.showMenu,
            pageLayout: route.meta.pageLayout,
            permission: route.permission,
          },
        },
      })
      plannedNames.add(route.name)
    }

    const previousPlan = this.installedPlan
    this.removeInstalled()
    try {
      this.addPlan(planned)
    } catch (error) {
      this.removeInstalled()
      this.addPlan(previousPlan)
      throw error
    }

    const restorePath = this.reconcile(planned, options.requestedPath)
    await this.router.replace(restorePath)
    quarantined.sort((left, right) => left.index - right.index)
    return {
      installed: planned.map((item) => item.contract),
      denied,
      quarantined,
      restorePath,
    }
  }

  clear(): void {
    this.removeInstalled()
    this.uiState.replace({
      tabs: [{ routeName: 'home', path: '/home', menuId: '0' }],
      selectedMenuId: '0',
      lastRoute: '/home',
    })
  }

  private addPlan(plan: readonly PlannedRoute[]) {
    const removers: Array<() => void> = []
    try {
      for (const item of plan) {
        removers.push(this.router.addRoute(item.contract.parentName ?? this.rootRouteName, item.record))
      }
    } catch (error) {
      for (const remove of removers.reverse()) remove()
      throw error
    }
    this.installedPlan = plan
    this.removers = removers
  }

  private removeInstalled() {
    for (const remove of this.removers.reverse()) remove()
    this.removers = []
    this.installedPlan = []
  }

  private reconcile(plan: readonly PlannedRoute[], requestedPath?: string | null): string {
    const snapshot = this.uiState.snapshot()
    const routeByName = new Map(plan.map((item) => [item.contract.name as string, item.contract]))
    const allowedPaths = new Set(['/home', ...plan.map((item) => item.contract.path as string)])
    const menuIds = new Set(plan.map((item) => item.contract.menuId))
    const tabs = snapshot.tabs.filter((tab) => {
      if (tab.routeName === 'home') return tab.path === '/home' && tab.menuId === '0'
      const route = routeByName.get(tab.routeName)
      return route?.path === tab.path && route.menuId === tab.menuId
    })
    const requestedApplicationPath = applicationPath(requestedPath)
    const lastApplicationPath = applicationPath(snapshot.lastRoute)
    const restorePath = requestedApplicationPath && allowedPaths.has(requestedApplicationPath)
      ? validatedRelativeRedirect(requestedPath ?? '') ?? '/home'
      : lastApplicationPath && allowedPaths.has(lastApplicationPath)
        ? validatedRelativeRedirect(snapshot.lastRoute ?? '') ?? '/home'
        : '/home'
    this.uiState.replace({
      tabs,
      selectedMenuId: menuIds.has(snapshot.selectedMenuId) ? snapshot.selectedMenuId : '0',
      lastRoute: restorePath,
    })
    return restorePath
  }
}
