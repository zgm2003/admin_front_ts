import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import { CommonEnum } from '@/enums'
import { OrderApi } from '@/api/pay/order'
import { NotificationApi, type NotificationItem } from '@/api/system/notification'
import { UsersApi } from '@/api/user/users'
import { UsersQuickEntryApi } from '@/api/user/usersQuickEntry'
import { onWsMessage } from '@/hooks/useWebSocket'
import { useUserStore } from '@/store/user'
import {
  buildAddressLabel,
  HOME_QUICK_ENTRY_LIMIT,
  buildQuickEntryDraft,
  buildQuickEntryManagerOptions,
  isQuickEntryLimitReached,
  moveQuickEntryDraftItem,
  resolveHomeNavigationAction,
  type HomeQuickEntryDraftItem,
} from './helpers'

interface HomeProfileSummary {
  sex: number
  birthday: string
  address: number
  detail_address: string
  bio: string
  addressTree: import('./helpers').AddressTreeNode[]
  sexOptions: Array<{ label: string; value: number }>
}

interface HomeWalletSummary {
  balance: number
  frozen: number
  total_recharge: number
  total_consume: number
  created_at: string
}

function getErrorMessage(error: unknown, fallback: string) {
  return error && typeof error === 'object' && 'message' in error && typeof error.message === 'string'
    ? error.message
    : fallback
}

export function useHomeDashboard() {
  const router = useRouter()
  const userStore = useUserStore()
  const { t } = useI18n()

  const notificationsLoading = ref(false)
  const walletLoading = ref(false)
  const profileSummary = ref<HomeProfileSummary | null>(null)
  const notifications = ref<NotificationItem[]>([])
  const unreadCount = ref(0)
  const wallet = ref<HomeWalletSummary>({
    balance: 0,
    frozen: 0,
    total_recharge: 0,
    total_consume: 0,
    created_at: '',
  })

  const savingQuickEntries = ref(false)
  const quickEntryManagerVisible = ref(false)
  const selectedPermissionId = ref<number | ''>('')
  const quickEntryDraft = ref<HomeQuickEntryDraftItem[]>([])

  const avatar = computed(() => userStore.avatar || '')
  const displayName = computed(() => userStore.username || t('home.userFallback'))
  const roleName = computed(() => userStore.role_name || t('home.roleFallback'))

  const quickEntryCards = computed(() =>
    buildQuickEntryDraft({
      quickEntries: userStore.quickEntry,
      routes: userStore.router,
      permissionMap: userStore.permissionMap,
    }),
  )

  const profileItems = computed(() => {
    if (!profileSummary.value) {
      return []
    }

    const sexLabel = profileSummary.value.sexOptions.find((item) => item.value === profileSummary.value?.sex)?.label || '--'
    const birthday = profileSummary.value.birthday || '--'
    const address = profileSummary.value.address > 0
      ? (buildAddressLabel(profileSummary.value.addressTree, profileSummary.value.address) || '--')
      : '--'
    const detailAddress = profileSummary.value.detail_address || '--'

    return [
      { key: 'sex', label: t('personal.form.sex'), value: sexLabel },
      { key: 'birthday', label: t('personal.form.birthday'), value: birthday },
      { key: 'address', label: t('personal.form.address'), value: address },
      { key: 'detail_address', label: t('personal.form.detailAddress'), value: detailAddress },
    ]
  })

  const profileBio = computed(() => profileSummary.value?.bio?.trim() || '')

  const availableQuickEntryOptions = computed(() =>
    buildQuickEntryManagerOptions({
      routes: userStore.router,
      permissionMap: userStore.permissionMap,
      selectedPermissionIds: new Set(quickEntryDraft.value.map((item) => item.permissionId)),
    }),
  )
  const quickEntryLimitReached = computed(() => isQuickEntryLimitReached(quickEntryDraft.value.length))

  async function loadProfileSummary() {
    const userId = Number(userStore.user_id)
    if (!Number.isFinite(userId) || userId <= 0) {
      profileSummary.value = null
      return
    }

    const data = await UsersApi.initPersonal({ user_id: userId })
    profileSummary.value = {
      sex: data.list.sex,
      birthday: data.list.birthday,
      address: data.list.address,
      detail_address: data.list.detail_address,
      bio: data.list.bio,
      addressTree: data.dict.auth_address_tree as HomeProfileSummary['addressTree'],
      sexOptions: data.dict.sexArr,
    }
  }

  async function loadWalletSummary() {
    walletLoading.value = true
    try {
      const data = await OrderApi.walletInfo()
      wallet.value = {
        balance: Number(data.balance ?? 0),
        frozen: Number(data.frozen ?? 0),
        total_recharge: Number(data.total_recharge ?? 0),
        total_consume: Number(data.total_consume ?? 0),
        created_at: typeof data.created_at === 'string' ? data.created_at : '',
      }
    } finally {
      walletLoading.value = false
    }
  }

  async function loadNotificationSnapshot() {
    notificationsLoading.value = true
    try {
      const [countResult, listResult] = await Promise.allSettled([
        NotificationApi.unreadCount(),
        NotificationApi.list({ current_page: 1, page_size: 5 }),
      ])

      if (countResult.status === 'fulfilled') {
        unreadCount.value = countResult.value.count
      }

      if (listResult.status === 'fulfilled') {
        notifications.value = listResult.value.list
      }
    } finally {
      notificationsLoading.value = false
    }
  }

  async function loadHomeData() {
    await Promise.allSettled([
      loadProfileSummary(),
      loadWalletSummary(),
      loadNotificationSnapshot(),
    ])
  }

  function goTo(path: string) {
    const action = resolveHomeNavigationAction(path)
    if (action.type === 'none') {
      return
    }

    const target = action.value
    if (!target) {
      return
    }

    if (action.type === 'external') {
      window.open(target, '_blank', 'noopener,noreferrer')
      return
    }

    void router.push(target)
  }

  function goToPersonal() {
    const userId = Number(userStore.user_id)
    router.push({
      path: '/personal',
      query: { user_id: Number.isFinite(userId) && userId > 0 ? userId : '' },
    })
  }

  function goToWallet() {
    router.push('/wallet')
  }

  function goToNotifications() {
    router.push('/notification')
  }

  async function openNotification(item: NotificationItem) {
    if (item.is_read === CommonEnum.NO) {
      unreadCount.value = Math.max(0, unreadCount.value - 1)
      notifications.value = notifications.value.map((current) =>
        current.id === item.id
          ? { ...current, is_read: CommonEnum.YES }
          : current,
      )

      void NotificationApi.read({ id: item.id }).catch(() => {
        void loadNotificationSnapshot()
      })
    }

    goTo(item.link || '/notification')
  }

  function openQuickEntryManager() {
    quickEntryDraft.value = [...quickEntryCards.value]
    selectedPermissionId.value = ''
    quickEntryManagerVisible.value = true
  }

  function addQuickEntryDraft() {
    if (quickEntryLimitReached.value) {
      return
    }

    const permissionId = Number(selectedPermissionId.value)
    if (!Number.isFinite(permissionId) || permissionId <= 0) {
      return
    }

    const option = availableQuickEntryOptions.value.find((item) => item.permissionId === permissionId)
    if (!option) {
      return
    }

    quickEntryDraft.value = [
      ...quickEntryDraft.value,
      {
        ...option,
        id: null,
      },
    ]
    selectedPermissionId.value = ''
  }

  function removeQuickEntryDraft(permissionId: number) {
    quickEntryDraft.value = quickEntryDraft.value.filter((item) => item.permissionId !== permissionId)
  }

  function moveQuickEntry(index: number, delta: -1 | 1) {
    quickEntryDraft.value = moveQuickEntryDraftItem(quickEntryDraft.value, index, delta)
  }

  async function saveQuickEntryDraft() {
    const originalDraft = quickEntryCards.value
    const originalPermissionIds = originalDraft.map((item) => item.permissionId)
    const draftPermissionIds = quickEntryDraft.value.map((item) => item.permissionId)

    const unchanged = draftPermissionIds.length === originalPermissionIds.length
      && draftPermissionIds.every((permissionId, index) => permissionId === originalPermissionIds[index])

    if (unchanged) {
      quickEntryManagerVisible.value = false
      return
    }

    savingQuickEntries.value = true
    try {
      const response = await UsersQuickEntryApi.save({
        permission_ids: draftPermissionIds,
      })

      userStore.quickEntry = response.quick_entry
      quickEntryManagerVisible.value = false
      ElMessage.success(t('home.quickEntrySaved'))
    } catch (error) {
      await userStore.fetchUserInfo()
      quickEntryDraft.value = [...quickEntryCards.value]
      ElMessage.error(getErrorMessage(error, t('common.fail.operation')))
    } finally {
      savingQuickEntries.value = false
    }
  }

  function resolveEntryLabel(entry: { label: string; i18n_key?: string }) {
    if (entry.i18n_key) {
      const translated = t(entry.i18n_key)
      if (translated && translated !== entry.i18n_key) {
        return translated
      }
    }

    return entry.label
  }

  const localizedQuickEntryCards = computed(() =>
    quickEntryCards.value.map((item) => ({
      ...item,
      label: resolveEntryLabel({
        label: item.label,
        i18n_key: userStore.permissionMap.get(String(item.permissionId))?.i18n_key,
      }),
    })),
  )

  let unsubscribe: (() => void) | null = null

  onMounted(() => {
    unsubscribe = onWsMessage('notification', () => {
      void loadNotificationSnapshot()
    })
  })

  onUnmounted(() => {
    unsubscribe?.()
  })

  return {
    savingQuickEntries,
    notificationsLoading,
    walletLoading,
    avatar,
    displayName,
    roleName,
    profileItems,
    profileBio,
    notifications,
    unreadCount,
    wallet,
    localizedQuickEntryCards,
    quickEntryManagerVisible,
    quickEntryDraft,
    quickEntryLimitReached,
    quickEntryLimit: HOME_QUICK_ENTRY_LIMIT,
    selectedPermissionId,
    availableQuickEntryOptions,
    loadHomeData,
    goTo,
    goToPersonal,
    goToWallet,
    goToNotifications,
    openNotification,
    openQuickEntryManager,
    addQuickEntryDraft,
    removeQuickEntryDraft,
    moveQuickEntry,
    saveQuickEntryDraft,
  }
}
