<script setup lang="ts">
import { computed, ref, shallowRef, watch } from 'vue'
import { ElNotification } from 'element-plus'
import { useI18n } from 'vue-i18n'
import { AiContextApi, type AiContextProfile, type AiContextSpace } from '@/api/ai/context'
import type { AiAgentItem } from '@/api/ai/agents'

const props = defineProps<{ agent: AiAgentItem | null }>()
const visible = defineModel<boolean>({ required: true })
const emit = defineEmits<{ saved: [] }>()
const { t } = useI18n()
const profiles = ref<AiContextProfile[]>([])
const spaces = ref<AiContextSpace[]>([])
const profileID = shallowRef<number | null>(null)
const persistedProfileID = shallowRef<number | null>(null)
const spaceIDs = ref<number[]>([])
const loading = shallowRef(false)
const saving = shallowRef(false)
const profileChanged = computed(() => profileID.value !== persistedProfileID.value)

function profileLabel(profile: AiContextProfile) {
  return `${profile.name} · ${profile.status} / ${profile.index_state}`
}

async function loadSpaces(id: number | null) {
  spaces.value = []
  if (id === null) return
  const response = await AiContextApi.spaces.list({ profile_id: id, status: 'enabled' })
  if (response.items.some(space => space.profile_id !== id)) {
    throw new Error('Context space response contains a mismatched profile')
  }
  spaces.value = response.items
}

async function load() {
  if (!props.agent) return
  loading.value = true
  try {
    const [profileList, profile, bindings] = await Promise.all([
      AiContextApi.profiles.list(),
      AiContextApi.agents.profile(props.agent.id),
      AiContextApi.agents.spaces(props.agent.id),
    ])
    profiles.value = profileList.items
    profileID.value = profile.profile_id
    persistedProfileID.value = profile.profile_id
    await loadSpaces(profile.profile_id)
    const compatible = new Set(spaces.value.map(space => space.id))
    if (bindings.space_ids.some(id => !compatible.has(id))) {
      throw new Error('Agent Context bindings contain a Space from another Profile')
    }
    spaceIDs.value = bindings.space_ids
  } finally {
    loading.value = false
  }
}

async function changeProfile(value: number | null | undefined) {
  // Element Plus emits undefined when a clearable select is cleared.
  const id = value === undefined ? null : value
  profileID.value = id
  spaceIDs.value = []
  await loadSpaces(id)
}

async function save() {
  if (!props.agent) return
  saving.value = true
  try {
    if (profileChanged.value) {
      const persisted = await AiContextApi.agents.updateProfile(props.agent.id, profileID.value)
      persistedProfileID.value = persisted.profile_id
      await loadSpaces(persisted.profile_id)
    }
    if (profileID.value !== null) {
      await AiContextApi.agents.updateSpaces(props.agent.id, spaceIDs.value)
    }
    ElNotification.success({ message: t('common.success.operation') })
    emit('saved')
    visible.value = false
  } finally {
    saving.value = false
  }
}

watch(visible, open => { if (open) void load() })
</script>

<template>
  <el-dialog
    v-model="visible"
    :title="t('aiAgents.context.title')"
    width="620px"
  >
    <div
      v-loading="loading"
      class="agent-context"
    >
      <div class="agent-context__identity">
        <span>{{ t('aiAgents.context.agent') }}</span><strong>{{ agent?.name }}</strong>
      </div>
      <el-form label-position="top">
        <el-form-item :label="t('aiAgents.context.profile')">
          <el-select
            :model-value="profileID"
            clearable
            :placeholder="t('aiAgents.context.pureChat')"
            @update:model-value="changeProfile"
          >
            <el-option
              v-for="profile in profiles"
              :key="profile.id"
              :value="profile.id"
              :label="profileLabel(profile)"
              :disabled="profile.status !== 'enabled' || profile.index_state === 'failed'"
            />
          </el-select>
        </el-form-item>
        <el-alert
          v-if="profileID === null"
          :title="t('aiAgents.context.pureChatDescription')"
          type="info"
          :closable="false"
          show-icon
        />
        <el-form-item
          v-else
          :label="t('aiAgents.context.spaces')"
        >
          <el-select
            v-model="spaceIDs"
            multiple
            collapse-tags
            collapse-tags-tooltip
            :placeholder="t('aiAgents.context.selectSpaces')"
          >
            <el-option
              v-for="space in spaces"
              :key="space.id"
              :value="space.id"
              :label="space.name"
            />
          </el-select>
          <p
            v-if="spaces.length === 0"
            class="agent-context__hint"
          >
            {{ t('aiAgents.context.privateContext') }}
          </p>
        </el-form-item>
      </el-form>
    </div>
    <template #footer>
      <el-button
        :disabled="saving"
        @click="visible = false"
      >
        {{ t('common.actions.cancel') }}
      </el-button><el-button
        type="primary"
        :loading="saving"
        @click="save"
      >
        {{ t('common.actions.save') }}
      </el-button>
    </template>
  </el-dialog>
</template>

<style scoped>
.agent-context { min-height: 250px; }
.agent-context__identity { display: flex; gap: 10px; padding: 10px 0 16px; border-bottom: 1px solid var(--el-border-color-lighter); margin-bottom: 16px; }
.agent-context__identity span, .agent-context__hint { color: var(--el-text-color-secondary); font-size: 12px; }
.agent-context__hint { margin: 7px 0 0; }
:deep(.el-select) { width: 100%; }
</style>
