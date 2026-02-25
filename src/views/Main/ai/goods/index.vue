<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { GoodsApi } from '@/api/ai/goods'
import { ElNotification } from 'element-plus'
import { Search } from '@/components/Search'
import type { SearchField } from '@/components/Search/types'
import { AppTable } from '@/components/Table'
import { useIsMobile } from '@/hooks/useResponsive'
import { useTable } from '@/hooks/useTable'

const { t } = useI18n()
const isMobile = useIsMobile()
const dict = ref({ goods_platform_arr: [], goods_status_arr: [], goods_agent_list: [], goods_voice_arr: [], goods_emotion_arr: [] } as any)

// ==================== 搜索 & 状态Tab ====================
const searchForm = ref({ title: '', platform: '', status: '' } as any)
const statusArr = ref<any[]>([])

const loadStatusCount = () => {
  GoodsApi.statusCount({ title: searchForm.value.title, platform: searchForm.value.platform }).then((data: any) => {
    statusArr.value = data
    if (!searchForm.value.status && data.length) {
      searchForm.value.status = data[0].value
    }
    getList()
  })
}

const refreshStatusCount = () => {
  GoodsApi.statusCount({ title: searchForm.value.title, platform: searchForm.value.platform }).then((data: any) => {
    statusArr.value = data
  })
}

const handleSearch = () => {
  page.value.current_page = 1
  getList()
  refreshStatusCount()
}

const {
  loading: listLoading, data: listData, page,
  onPageChange, refresh, getList, onSelectionChange, confirmDel, batchDel
} = useTable({ api: GoodsApi, searchForm })

// ==================== 搜索字段 & 列定义 ====================
const searchFields = computed<SearchField[]>(() => [
  { key: 'title', type: 'input', label: t('goods.filter.title'), placeholder: t('goods.filter.title'), width: 180 },
  {
    key: 'platform', type: 'select-v2', label: t('goods.filter.platform'),
    placeholder: t('goods.filter.platform'), width: 140, options: dict.value.goods_platform_arr
  }
])

const columns = computed(() => [
  { key: 'main_img', label: t('goods.table.main_img'), width: 80 },
  { key: 'title', label: t('goods.table.title'), minWidth: 180, overflowTooltip: true },
  { key: 'platform', label: t('goods.table.platform'), width: 100 },
  { key: 'status', label: t('goods.table.status'), width: 110 },
  { key: 'audio_url', label: t('goods.table.audio_url'), width: 280, overflowTooltip: false },
  { key: 'srt_url', label: 'SRT', width: 130 },
  { key: 'created_at', label: t('common.createdAt'), width: 160 },
  { key: 'actions', label: t('common.actions.action'), width: 200 }
])

// ==================== 弹窗状态 ====================
const dialogVisible = ref(false)
const form = ref({} as any)

const detailVisible = ref(false)
const detailData = ref({} as any)

// ==================== Init ====================
const init = () => {
  GoodsApi.init().then((data: any) => { dict.value = data.dict || {} })
}

// ==================== 选品平台 ====================
const platformVisible = ref(false)
const platforms = [
  { name: '淘宝', img: 'taobao.webp', url: 'https://www.taobao.com' },
  { name: '京东', img: 'jingdong.jpg', url: 'https://www.jd.com' },
  { name: '天猫', img: 'tianmao.webp', url: 'https://www.tmall.com' },
  { name: '天猫超市', img: 'tianmaoShop.webp', url: 'https://chaoshi.tmall.com' },
  { name: '拼多多', img: 'pinduoduo.png', url: 'https://mobile.yangkeduo.com' },
]
const platformImgs = import.meta.glob('@/assets/img/platform/*', { eager: true, import: 'default' }) as Record<string, string>
const getPlatformImg = (filename: string) => {
  const key = Object.keys(platformImgs).find(k => k.endsWith('/' + filename))
  return key ? platformImgs[key] : ''
}
const openPlatform = (url: string) => window.open(url, '_blank')

// ==================== CRUD ====================

const edit = (row: any) => {
  form.value = {
    id: row.id, title: row.title, main_img: row.main_img,
    link: row.link, platform_name: row.platform_name || '',
    tips: row.tips || '', point: row.point || '', script_text: row.script_text || '',
    ocr: row.ocr || '', model_origin: row.model_origin || '',
    image_list: row.image_list || [], image_list_success: row.image_list_success || row.image_list || [],
    status: row.status, status_name: row.status_name || '',
    meta: row.meta || {},
    srt_url: row.srt_url || '',
  }
  // 编辑弹窗内的智能体选择
  editAgentId.value = dict.value.goods_agent_list?.[0]?.value ?? ''
  editOcrLoading.value = false
  editGenLoading.value = false
  editTtsLoading.value = false
  editVoice.value = dict.value.goods_voice_arr?.[0]?.value ?? 'zh-CN-XiaoxiaoNeural'
  editEmotion.value = 'default'
  editMetaText.value = metaToText(form.value.meta)
  dialogVisible.value = true
}

// 编辑弹窗内的操作状态
const editAgentId = ref<number | ''>('')
const editOcrLoading = ref(false)
const editGenLoading = ref(false)
const editTtsLoading = ref(false)
const editVoice = ref('zh-CN-XiaoxiaoNeural')
const editEmotion = ref('default')

const toggleEditImage = (img: string) => {
  const list = form.value.image_list_success
  const idx = list.indexOf(img)
  idx > -1 ? list.splice(idx, 1) : list.push(img)
}

/** 关闭编辑弹窗并刷新列表 */
const closeAndRefresh = () => {
  dialogVisible.value = false
  getList()
  refreshStatusCount()
}

const doEditOcr = async () => {
  if (!form.value.image_list_success?.length) return ElNotification.warning({ message: t('goods.ocr.selectImages') })
  editOcrLoading.value = true
  try {
    await GoodsApi.ocr({ id: form.value.id, image_list_success: form.value.image_list_success })
    ElNotification.success({ message: t('goods.ocr.submitted') })
    closeAndRefresh()
  } finally { editOcrLoading.value = false }
}

const doEditGenerate = async () => {
  if (!editAgentId.value) return ElNotification.warning({ message: t('goods.generate.selectAgent') })
  editGenLoading.value = true
  try {
    await GoodsApi.generate({ id: form.value.id, agent_id: editAgentId.value, tips: form.value.tips })
    ElNotification.success({ message: t('goods.generate.submitted') })
    closeAndRefresh()
  } finally { editGenLoading.value = false }
}

const doEditTts = async () => {
  if (!form.value.script_text) return ElNotification.warning({ message: t('goods.tts.noScript') })
  editTtsLoading.value = true
  try {
    await GoodsApi.tts({ id: form.value.id, voice: editVoice.value, emotion: editEmotion.value, script_text: form.value.script_text })
    ElNotification.success({ message: t('goods.tts.submitted') })
    closeAndRefresh()
  } finally { editTtsLoading.value = false }
}

const confirmSubmit = async () => {
  form.value.meta = textToMeta(editMetaText.value)
  await GoodsApi.edit(form.value)
  ElNotification.success({ message: t('common.success.operation') })
  closeAndRefresh()
}

// ==================== 详情 ====================
const showDetail = (row: any) => {
  detailData.value = row
  detailVisible.value = true
}

// ==================== 工具 ====================
const metaLabels: Record<string, string> = {
  price: 'goods.meta.price', originalPrice: 'goods.meta.originalPrice', sales: 'goods.meta.sales',
  brand: 'goods.meta.brand', shop: 'goods.meta.shop', specs: 'goods.meta.specs',
  description: 'goods.meta.description', reviews: 'goods.meta.reviews',
}

/** 将 meta 对象格式化为可读文本（key: value 每行一个） */
const metaToText = (meta: any): string => {
  if (!meta || typeof meta !== 'object') return ''
  return Object.entries(meta)
    .filter(([, v]) => v && String(v).trim())
    .map(([k, v]) => {
      const label = metaLabels[k] ? t(metaLabels[k]) : k
      const val = Array.isArray(v) ? v.join('、') : String(v)
      return `${label}: ${val}`
    })
    .join('\n')
}

/** 将文本解析回 meta 对象 */
const textToMeta = (text: string): Record<string, string> => {
  const result: Record<string, string> = {}
  const labelToKey: Record<string, string> = {}
  for (const [k, v] of Object.entries(metaLabels)) {
    labelToKey[t(v)] = k
    labelToKey[k] = k // 也支持直接用英文 key
  }
  for (const line of text.split('\n')) {
    const idx = line.indexOf(':')
    if (idx < 1) continue
    const rawLabel = line.slice(0, idx).trim()
    const val = line.slice(idx + 1).trim()
    const key = labelToKey[rawLabel] || rawLabel
    if (val) result[key] = val
  }
  return result
}

const editMetaText = ref('')

const downloadSrt = (url: string) => {
  const a = document.createElement('a')
  a.href = url
  a.download = url.split('/').pop() || 'subtitle.srt'
  a.click()
}

const statusType = (status: number): 'info' | 'warning' | 'success' | 'danger' | 'primary' => {
  const map: Record<number, 'info' | 'warning' | 'success' | 'danger' | 'primary'> = {
    1: 'info', 2: 'warning', 3: 'primary', 4: 'warning', 5: 'primary', 6: 'warning', 7: 'success', 8: 'danger'
  }
  return map[status] || 'info'
}

onMounted(() => {
  init()
  loadStatusCount()
})
</script>

<template>
  <div class="box">
    <!-- 状态Tab -->
    <el-tabs v-model="searchForm.status" @tab-change="handleSearch">
      <el-tab-pane v-for="item in statusArr" :key="item.value" :name="item.value">
        <template #label>{{ item.label }} ({{ item.num }})</template>
      </el-tab-pane>
    </el-tabs>

    <!-- 搜索 -->
    <Search v-model="searchForm" :fields="searchFields" @query="handleSearch" @reset="handleSearch" />

    <!-- 表格 -->
    <div class="table">
      <AppTable
        :columns="columns" :data="listData" :loading="listLoading" row-key="id"
        :pagination="page" selectable :show-index="true"
        @refresh="refresh" @update:pagination="onPageChange" @selection-change="onSelectionChange"
      >
        <template #toolbar-left>
          <el-button type="primary" @click="platformVisible = true">{{ t('goods.actions.selectProduct') }}</el-button>
          <el-button type="danger" :disabled="!listData.length" @click="batchDel">{{ t('common.actions.batchDelete') }}</el-button>
        </template>

        <template #cell-main_img="{ row }">
          <el-image v-if="row.main_img" :src="row.main_img" style="width:50px;height:50px;border-radius:4px"
            fit="cover" :preview-src-list="[row.main_img]" preview-teleported lazy />
          <span v-else>-</span>
        </template>

        <template #cell-platform="{ row }">
          <el-tag v-if="row.platform_name" size="small">{{ row.platform_name }}</el-tag>
          <span v-else>-</span>
        </template>

        <template #cell-status="{ row }">
          <el-tag :type="statusType(row.status)" size="small">{{ row.status_name }}</el-tag>
          <el-tooltip v-if="row.status_msg" :content="row.status_msg" placement="top">
            <el-icon color="var(--el-color-danger)" style="margin-left:4px;cursor:help;vertical-align:middle">
              <svg viewBox="0 0 1024 1024" width="14" height="14"><circle cx="512" cy="512" r="460" fill="none" stroke="currentColor" stroke-width="60"/><text x="512" y="580" text-anchor="middle" font-size="500" fill="currentColor">!</text></svg>
            </el-icon>
          </el-tooltip>
        </template>

        <template #cell-audio_url="{ row }">
          <audio v-if="row.audio_url" :src="row.audio_url" controls style="height:30px;width:250px" />
          <span v-else>-</span>
        </template>

        <template #cell-srt_url="{ row }">
          <el-button v-if="row.srt_url" type="primary" text size="small" @click="downloadSrt(row.srt_url)">{{ t('goods.srt.download') }}</el-button>
          <span v-else>-</span>
        </template>

        <template #cell-actions="{ row }">
          <el-button type="primary" text size="small" @click="showDetail(row)">{{ t('common.actions.detail') }}</el-button>
          <el-button type="primary" text size="small" @click="edit(row)">{{ t('common.actions.edit') }}</el-button>
          <el-button type="danger" text size="small" @click="confirmDel(row)">{{ t('common.actions.del') }}</el-button>
        </template>
      </AppTable>
    </div>
  </div>

  <!-- 编辑工作台弹窗 -->
  <el-dialog v-model="dialogVisible" fullscreen destroy-on-close class="workbench-dialog">
    <template #header>
      <div class="wb-header">
        <span>{{ t('goods.editTitle') }}</span>
        <el-tag :type="statusType(form.status)" size="small" style="margin-left:8px">{{ form.status_name }}</el-tag>
      </div>
    </template>

    <div class="wb-body">
      <!-- 图片选择区 -->
      <div v-if="form.image_list?.length" class="wb-images">
        <div class="wb-section-title">{{ t('goods.detail.images') }}（{{ t('goods.ocr.hint') }}）</div>
        <div class="wb-image-grid">
          <div v-for="(img, i) in form.image_list" :key="i"
            class="wb-image-item" :class="{ selected: form.image_list_success?.includes(img) }">
            <el-image :src="img" fit="cover" style="width:100%;height:100%" lazy
              :preview-src-list="form.image_list" :initial-index="Number(i)" preview-teleported />
            <el-checkbox class="wb-image-check" :model-value="form.image_list_success?.includes(img)"
              @change="toggleEditImage(img)" />
          </div>
        </div>
        <div style="margin-top:8px;display:flex;align-items:center;gap:8px">
          <el-button type="warning" size="small" :loading="editOcrLoading" @click="doEditOcr"
            :disabled="!form.image_list_success?.length">
            {{ t('goods.ocr.buttonText', { count: form.image_list_success?.length || 0 }) }}
          </el-button>
        </div>
      </div>

      <!-- 四列工作区 -->
      <div class="wb-columns">
        <!-- 1. 商品信息 -->
        <div class="wb-col">
          <div class="wb-col-title wb-col-title--info">{{ t('goods.detail.productInfo') }}</div>
          <div class="wb-col-body">
            <div class="wb-field">
              <label>{{ t('goods.form.title') }}</label>
              <el-input v-model="form.title" size="small" />
            </div>
            <div class="wb-field">
              <label>{{ t('goods.form.link') }}</label>
              <el-input v-model="form.link" size="small" />
            </div>
            <div class="wb-field">
              <label>OCR {{ t('goods.detail.ocrResult') }}</label>
              <div class="wb-text-block">{{ form.ocr || '-' }}</div>
            </div>
            <!-- 采集元数据（文本编辑） -->
            <div class="wb-field">
              <label>{{ t('goods.meta.title') }}</label>
              <div class="wb-meta-hint">{{ t('goods.meta.hint') }}</div>
              <el-input v-model="editMetaText" type="textarea" :rows="5" size="small"
                :placeholder="t('goods.meta.placeholder')" />
            </div>
          </div>
        </div>

        <!-- 2. AI提示词工程 -->
        <div class="wb-col">
          <div class="wb-col-title wb-col-title--prompt">{{ t('goods.detail.promptEng') }}</div>
          <div class="wb-col-body">
            <div class="wb-field">
              <label>{{ t('goods.generate.agent') }}</label>
              <el-select-v2 v-model="editAgentId" :options="dict.goods_agent_list" style="width:100%" size="small"
                :placeholder="t('goods.generate.selectAgent')" />
            </div>
            <div class="wb-field">
              <label>{{ t('goods.form.tips') }}</label>
              <el-input v-model="form.tips" type="textarea" :rows="4" size="small"
                :placeholder="t('goods.generate.tipsPlaceholder')" />
            </div>
            <el-button type="primary" size="small" :loading="editGenLoading" @click="doEditGenerate"
              style="margin-top:8px;width:100%">
              {{ t('goods.generate.start') }}
            </el-button>
            <div v-if="form.model_origin" class="wb-field" style="margin-top:12px">
              <label>{{ t('goods.detail.modelOrigin') }}</label>
              <div class="wb-text-block wb-text-sm">{{ form.model_origin }}</div>
            </div>
          </div>
        </div>

        <!-- 3. 卖点 -->
        <div class="wb-col">
          <div class="wb-col-title wb-col-title--point">{{ t('goods.detail.sellingPoints') }}</div>
          <div class="wb-col-body">
            <el-input v-model="form.point" type="textarea" :rows="16" size="small"
              :placeholder="t('goods.detail.sellingPointsHint')" />
          </div>
        </div>

        <!-- 4. 口播词 -->
        <div class="wb-col">
          <div class="wb-col-title wb-col-title--script">{{ t('goods.detail.finalScript') }}</div>
          <div class="wb-col-body">
            <el-input v-model="form.script_text" type="textarea" :rows="12" size="small"
              :placeholder="t('goods.detail.finalScriptHint')" />
            <div class="wb-field">
              <label>{{ t('goods.tts.voice') }}</label>
              <el-select-v2 v-model="editVoice" :options="dict.goods_voice_arr" style="width:100%" size="small" />
            </div>
            <div class="wb-field">
              <label>{{ t('goods.tts.emotion') }}</label>
              <el-select-v2 v-model="editEmotion" :options="dict.goods_emotion_arr" style="width:100%" size="small" />
            </div>
            <el-button type="danger" size="small" :loading="editTtsLoading" @click="doEditTts"
              style="width:100%" :disabled="!form.script_text">
              {{ t('goods.tts.start') }}
            </el-button>
            <el-button v-if="form.srt_url" type="success" size="small" style="width:100%;margin-top:6px"
              @click="downloadSrt(form.srt_url)">
              {{ t('goods.srt.download') }}
            </el-button>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <el-button @click="dialogVisible = false">{{ t('common.actions.cancel') }}</el-button>
      <el-button type="primary" @click="confirmSubmit">{{ t('common.actions.confirm') }}</el-button>
    </template>
  </el-dialog>

  <!-- 详情弹窗 -->
  <el-dialog v-model="detailVisible" :fullscreen="isMobile" width="750px" :title="t('goods.detailTitle')" destroy-on-close class="detail-dialog">
    <div class="detail-body">
      <el-descriptions :column="isMobile ? 1 : 2" border label-width="80px">
        <el-descriptions-item :label="t('goods.table.title')">{{ detailData.title || '-' }}</el-descriptions-item>
        <el-descriptions-item :label="t('goods.table.platform')">{{ detailData.platform_name || '-' }}</el-descriptions-item>
        <el-descriptions-item :label="t('goods.table.status')">
          <el-tag :type="statusType(detailData.status)" size="small">{{ detailData.status_name }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item :label="t('common.createdAt')">{{ detailData.created_at }}</el-descriptions-item>
        <el-descriptions-item :label="t('goods.form.link')" :span="2">
          <el-text v-if="detailData.link" truncated tag="a" :href="detailData.link" target="_blank" type="primary" style="cursor:pointer;max-width:500px">{{ detailData.link }}</el-text>
          <span v-else>-</span>
        </el-descriptions-item>
      </el-descriptions>

      <template v-if="detailData.ocr">
        <div class="detail-section-title">OCR {{ t('goods.detail.ocrResult') }}</div>
        <div class="detail-text-block">{{ detailData.ocr }}</div>
      </template>
      <template v-if="detailData.point">
        <div class="detail-section-title">{{ t('goods.form.point') }}</div>
        <div class="detail-text-block">{{ detailData.point }}</div>
      </template>
      <template v-if="detailData.script_text">
        <div class="detail-section-title">{{ t('goods.form.script_text') }}</div>
        <div class="detail-text-block">{{ detailData.script_text }}</div>
      </template>
      <template v-if="detailData.audio_url">
        <div class="detail-section-title">{{ t('goods.table.audio_url') }}</div>
        <audio :src="detailData.audio_url" controls style="width:100%;margin-top:8px" />
      </template>
      <template v-if="detailData.srt_url">
        <div class="detail-section-title">SRT {{ t('goods.srt.download') }}</div>
        <el-button type="primary" size="small" style="margin-top:8px" @click="downloadSrt(detailData.srt_url)">
          {{ t('goods.srt.download') }}
        </el-button>
      </template>
      <template v-if="detailData.image_list?.length">
        <div class="detail-section-title">{{ t('goods.detail.images') }}</div>
        <div class="image-grid">
          <el-image v-for="(img, i) in detailData.image_list" :key="i" :src="img"
            style="width:80px;height:80px;border-radius:4px" fit="cover"
            :preview-src-list="detailData.image_list" :initial-index="Number(i)" preview-teleported lazy />
        </div>
      </template>
      <template v-if="detailData.meta && Object.keys(detailData.meta).some(k => detailData.meta[k])">
        <div class="detail-section-title">{{ t('goods.meta.title') }}</div>
        <div class="detail-text-block">{{ metaToText(detailData.meta) }}</div>
      </template>
    </div>
  </el-dialog>

  <!-- 选品平台弹窗 -->
  <el-dialog v-model="platformVisible" :width="isMobile ? '94vw' : '480px'" :title="t('goods.platform.title')" destroy-on-close>
    <div class="platform-grid">
      <div v-for="p in platforms" :key="p.name" class="platform-card" @click="openPlatform(p.url)">
        <img :src="getPlatformImg(p.img)" :alt="p.name" class="platform-img" />
        <div class="platform-name">{{ p.name }}</div>
      </div>
    </div>
    <p class="platform-hint">{{ t('goods.platform.hint') }}</p>
  </el-dialog>
</template>

<style scoped>
.box { display: flex; flex-direction: column; height: 100% }
.table { flex: 1 1 auto; min-height: 0; overflow: auto }

/* 详情弹窗 */
.detail-body { max-height: 65vh; overflow-y: auto }
.detail-section-title {
  font-weight: 600; font-size: 14px; margin: 16px 0 8px; padding-left: 8px;
  border-left: 3px solid var(--el-color-primary);
}
.detail-text-block {
  background: var(--el-fill-color-light); padding: 12px; border-radius: 6px;
  white-space: pre-wrap; word-break: break-all; font-size: 13px; line-height: 1.6;
}
.image-grid { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 8px }

/* 选品平台 */
.platform-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 16px }
.platform-card {
  display: flex; flex-direction: column; align-items: center; gap: 8px;
  padding: 20px 12px; border-radius: 10px; cursor: pointer;
  background: var(--el-fill-color-light); transition: all .2s;
}
.platform-card:hover { background: var(--el-color-primary-light-9); transform: translateY(-2px) }
.platform-img { width: 48px; height: 48px; border-radius: 8px; object-fit: contain }
.platform-name { font-size: 14px; font-weight: 500 }
.platform-hint { margin-top: 16px; font-size: 12px; color: var(--el-text-color-secondary); text-align: center }

/* 工作台 */
.wb-header { display: flex; align-items: center; font-size: 15px; font-weight: 600 }
.wb-body { height: calc(100vh - 130px); overflow-y: auto; padding: 20px; background: var(--el-bg-color-page) }
.wb-images {
  margin-bottom: 20px; padding: 16px; background: var(--el-bg-color);
  border-radius: 8px; border: 1px solid var(--el-border-color-lighter);
}
.wb-section-title { font-size: 13px; font-weight: 500; color: var(--el-text-color-regular); margin-bottom: 10px }
.wb-image-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(80px, 1fr)); gap: 8px }
.wb-image-item {
  position: relative; aspect-ratio: 1; border-radius: 6px; overflow: hidden;
  border: 2px solid var(--el-border-color-lighter); transition: all .2s;
}
.wb-image-item:hover { border-color: var(--el-color-primary-light-3) }
.wb-image-item.selected { border-color: var(--el-color-primary); box-shadow: 0 0 0 1px var(--el-color-primary-light-5) }
.wb-image-check { position: absolute; top: 4px; right: 4px; z-index: 1 }
.wb-columns { display: flex; gap: 16px }
.wb-col {
  flex: 1; min-width: 0; background: var(--el-bg-color); border-radius: 8px;
  border: 1px solid var(--el-border-color-lighter); display: flex; flex-direction: column; overflow: hidden;
}
.wb-col-title {
  font-size: 13px; font-weight: 600; padding: 10px 14px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  color: var(--el-text-color-primary); background: var(--el-fill-color-lighter);
}
.wb-col-title--info { border-left: 3px solid var(--el-color-primary) }
.wb-col-title--prompt { border-left: 3px solid var(--el-color-warning) }
.wb-col-title--point { border-left: 3px solid var(--el-color-success) }
.wb-col-title--script { border-left: 3px solid var(--el-color-danger) }
.wb-col-body { flex: 1; display: flex; flex-direction: column; gap: 10px; padding: 14px }
.wb-field label { display: block; font-size: 12px; color: var(--el-text-color-secondary); margin-bottom: 4px; font-weight: 500 }
.wb-text-block {
  background: var(--el-fill-color-lighter); padding: 10px; border-radius: 6px;
  font-size: 12px; line-height: 1.7; white-space: pre-wrap; word-break: break-all;
  max-height: 200px; overflow-y: auto; border: 1px solid var(--el-border-color-lighter);
}
.wb-text-sm { max-height: 150px; font-size: 11px; color: var(--el-text-color-secondary) }
.wb-meta-hint { font-size: 11px; color: var(--el-color-warning); margin-bottom: 6px }

/* 移动端 */
@media (max-width: 768px) {
  .detail-body { max-height: none }
  .image-grid :deep(.el-image) { width: 60px !important; height: 60px !important }
  .platform-grid { grid-template-columns: repeat(3, 1fr); gap: 10px }
  .platform-card { padding: 14px 8px }
  .platform-img { width: 36px; height: 36px }
  .platform-name { font-size: 12px }
  .wb-body { padding: 12px; height: calc(100vh - 110px) }
  .wb-images { padding: 12px }
  .wb-image-grid { grid-template-columns: repeat(auto-fill, minmax(60px, 1fr)); gap: 6px }
  .wb-columns { flex-direction: column; gap: 12px }
  .wb-col { min-width: 0 }
}
</style>

<style>
/* 工作台弹窗：body 无 padding 让 wb-body 自控 */
.workbench-dialog .el-dialog__body { padding: 0; overflow: hidden }
/* 移动端强制全屏（穿透 teleport） */
@media (max-width: 768px) {
  .workbench-dialog.el-dialog {
    --el-dialog-margin-top: 0 !important;
    margin: 0 !important; width: 100vw !important; max-width: 100vw !important;
    height: 100vh !important; border-radius: 0 !important;
  }
}
</style>
