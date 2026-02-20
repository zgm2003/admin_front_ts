<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { GoodsApi } from '@/api/ai/goods'
import { ElNotification } from 'element-plus'
import type { FormInstance } from 'element-plus'
import { Search } from '@/components/Search'
import type { SearchField } from '@/components/Search/types'
import { AppTable } from '@/components/Table'
import { useIsMobile } from '@/hooks/useResponsive'
import { useTable } from '@/hooks/useTable'

const { t } = useI18n()
const isMobile = useIsMobile()
const dict = ref({ platformArr: [], statusArr: [] } as any)

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

const handleTabChange = () => {
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
    placeholder: t('goods.filter.platform'), width: 140, options: dict.value.platformArr
  }
])

const columns = computed(() => [
  { key: 'main_img', label: t('goods.table.main_img'), width: 80 },
  { key: 'title', label: t('goods.table.title'), minWidth: 180, overflowTooltip: true },
  { key: 'platform', label: t('goods.table.platform'), width: 100 },
  { key: 'status', label: t('goods.table.status'), width: 110 },
  { key: 'audio_url', label: t('goods.table.audio_url'), width: 100 },
  { key: 'created_at', label: t('common.createdAt'), width: 160 },
  { key: 'actions', label: t('common.actions.action'), width: 400 }
])

// ==================== 弹窗状态 ====================
const dialogVisible = ref(false)
const formRef = ref<FormInstance | null>(null)
const form = ref({} as any)

const detailVisible = ref(false)
const detailData = ref({} as any)

const ocrVisible = ref(false)
const ocrLoading = ref(false)
const ocrRow = ref({} as any)
const ocrSelectedImages = ref<string[]>([])

const generateVisible = ref(false)
const generateLoading = ref(false)
const generateRow = ref({} as any)
const generateTips = ref('')

const ttsVisible = ref(false)
const ttsLoading = ref(false)
const ttsRow = ref({} as any)
const ttsScriptText = ref('')

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
  { name: '拼多多', img: 'pinduoduo.png', url: 'https://www.pinduoduo.com' },
  { name: '1688', img: '1688.png', url: 'https://www.1688.com' },
  { name: '唯品会', img: 'weipinhui.jpg', url: 'https://www.vip.com' },
  { name: '苏宁', img: 'suning.webp', url: 'https://www.suning.com' },
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
    link: row.link,
    tips: row.tips || '', point: row.point || '', script_text: row.script_text || ''
  }
  dialogVisible.value = true
  nextTick(() => formRef.value?.clearValidate())
}

const confirmSubmit = async () => {
  await GoodsApi.edit(form.value)
  ElNotification.success({ message: t('common.success.operation') })
  dialogVisible.value = false
  getList()
  refreshStatusCount()
}

// ==================== 详情 ====================
const showDetail = (row: any) => {
  detailData.value = row
  detailVisible.value = true
}

// ==================== OCR ====================
const showOcr = (row: any) => {
  ocrRow.value = row
  ocrSelectedImages.value = [...(row.image_list_success || row.image_list || [])]
  ocrVisible.value = true
}

const toggleImage = (img: string) => {
  const idx = ocrSelectedImages.value.indexOf(img)
  idx > -1 ? ocrSelectedImages.value.splice(idx, 1) : ocrSelectedImages.value.push(img)
}

const doOcr = async () => {
  if (!ocrSelectedImages.value.length) {
    ElNotification.warning({ message: t('goods.ocr.selectImages') })
    return
  }
  ocrLoading.value = true
  try {
    await GoodsApi.ocr({ id: ocrRow.value.id, image_list_success: ocrSelectedImages.value })
    ElNotification.success({ message: t('common.success.operation') })
    ocrVisible.value = false
    getList()
    refreshStatusCount()
  } finally {
    ocrLoading.value = false
  }
}

// ==================== AI生成 ====================
const showGenerate = (row: any) => {
  generateRow.value = row
  generateTips.value = row.tips || ''
  generateVisible.value = true
}

const doGenerate = async () => {
  generateLoading.value = true
  try {
    await GoodsApi.generate({ id: generateRow.value.id, tips: generateTips.value })
    ElNotification.success({ message: t('common.success.operation') })
    generateVisible.value = false
    getList()
    refreshStatusCount()
  } finally {
    generateLoading.value = false
  }
}

// ==================== TTS ====================
const showTts = (row: any) => {
  ttsRow.value = row
  ttsScriptText.value = row.script_text || ''
  ttsVisible.value = true
}

const doTts = async () => {
  if (!ttsScriptText.value.trim()) {
    ElNotification.warning({ message: t('goods.tts.noScript') })
    return
  }
  ttsLoading.value = true
  try {
    await GoodsApi.tts({ id: ttsRow.value.id, script_text: ttsScriptText.value })
    ElNotification.success({ message: t('common.success.operation') })
    ttsVisible.value = false
    getList()
    refreshStatusCount()
  } finally {
    ttsLoading.value = false
  }
}

// ==================== 工具 ====================
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
    <el-tabs v-model="searchForm.status" @tab-change="handleTabChange">
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
          <audio v-if="row.audio_url" :src="row.audio_url" controls style="height:30px;max-width:80px" />
          <span v-else>-</span>
        </template>

        <template #cell-actions="{ row }">
          <el-button type="primary" text size="small" @click="showDetail(row)">{{ t('common.actions.detail') }}</el-button>
          <el-button type="primary" text size="small" @click="edit(row)">{{ t('common.actions.edit') }}</el-button>
          <el-button type="warning" text size="small" @click="showOcr(row)" :disabled="!row.image_list?.length">OCR</el-button>
          <el-button type="success" text size="small" @click="showGenerate(row)">{{ t('goods.actions.generate') }}</el-button>
          <el-button type="info" text size="small" @click="showTts(row)" :disabled="!row.script_text">TTS</el-button>
          <el-button type="danger" text size="small" @click="confirmDel(row)">{{ t('common.actions.del') }}</el-button>
        </template>
      </AppTable>
    </div>
  </div>

  <!-- 编辑弹窗 -->
  <el-dialog v-model="dialogVisible" :width="isMobile ? '94vw' : '650px'" destroy-on-close>
    <template #header>{{ t('goods.editTitle') }}</template>
    <el-form :model="form" ref="formRef" label-width="auto">
      <el-row :gutter="12">
        <el-col :span="24">
          <el-form-item :label="t('goods.form.title')"><el-input v-model="form.title" clearable /></el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item :label="t('goods.form.main_img')"><el-input v-model="form.main_img" clearable /></el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item :label="t('goods.form.link')"><el-input v-model="form.link" clearable /></el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item :label="t('goods.form.tips')"><el-input v-model="form.tips" type="textarea" :rows="2" placeholder="可选，例如：突出性价比、强调限时优惠、语气活泼等" /></el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item :label="t('goods.form.point')"><el-input v-model="form.point" type="textarea" :rows="2" /></el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item :label="t('goods.form.script_text')"><el-input v-model="form.script_text" type="textarea" :rows="4" /></el-form-item>
        </el-col>
      </el-row>
    </el-form>
    <template #footer>
      <el-button @click="dialogVisible = false">{{ t('common.actions.cancel') }}</el-button>
      <el-button type="primary" @click="confirmSubmit">{{ t('common.actions.confirm') }}</el-button>
    </template>
  </el-dialog>

  <!-- 详情弹窗 -->
  <el-dialog v-model="detailVisible" :width="isMobile ? '94vw' : '750px'" :title="t('goods.detailTitle')" destroy-on-close class="detail-dialog">
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
      <template v-if="detailData.image_list?.length">
        <div class="detail-section-title">{{ t('goods.detail.images') }}</div>
        <div class="image-grid">
          <el-image v-for="(img, i) in detailData.image_list" :key="i" :src="img"
            style="width:80px;height:80px;border-radius:4px" fit="cover"
            :preview-src-list="detailData.image_list" :initial-index="Number(i)" preview-teleported lazy />
        </div>
      </template>
    </div>
  </el-dialog>

  <!-- OCR弹窗 -->
  <el-dialog v-model="ocrVisible" :width="isMobile ? '94vw' : '700px'" :title="t('goods.ocr.title')" destroy-on-close>
    <p class="hint-text">{{ t('goods.ocr.hint') }}</p>
    <div class="image-select-grid">
      <div v-for="(img, i) in (ocrRow.image_list || [])" :key="i"
        class="image-select-item" :class="{ selected: ocrSelectedImages.includes(img) }"
        @click="toggleImage(img)">
        <el-image :src="img" fit="cover" style="width:100%;height:100%" lazy />
        <div v-if="ocrSelectedImages.includes(img)" class="image-check">✓</div>
      </div>
    </div>
    <template v-if="ocrRow.ocr">
      <div class="detail-section-title">{{ t('goods.ocr.previousResult') }}</div>
      <div class="detail-text-block" style="max-height:150px;overflow:auto">{{ ocrRow.ocr }}</div>
    </template>
    <template #footer>
      <el-button @click="ocrVisible = false">{{ t('common.actions.cancel') }}</el-button>
      <el-button type="primary" :loading="ocrLoading" @click="doOcr">
        {{ t('goods.ocr.start') }}（{{ ocrSelectedImages.length }}{{ t('goods.ocr.imagesSelected') }}）
      </el-button>
    </template>
  </el-dialog>

  <!-- 生成口播词弹窗 -->
  <el-dialog v-model="generateVisible" :width="isMobile ? '94vw' : '600px'" :title="t('goods.generate.title')" destroy-on-close>
    <el-form label-width="auto">
      <el-form-item :label="t('goods.table.title')">{{ generateRow.title || '-' }}</el-form-item>
      <el-form-item label="OCR">
        <div v-if="generateRow.ocr" class="detail-text-block" style="max-height:120px;overflow:auto">{{ generateRow.ocr }}</div>
        <span v-else class="hint-text">{{ t('goods.generate.noOcr') }}</span>
      </el-form-item>
      <el-form-item :label="t('goods.form.tips')">
        <el-input v-model="generateTips" type="textarea" :rows="3" :placeholder="t('goods.generate.tipsPlaceholder')" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="generateVisible = false">{{ t('common.actions.cancel') }}</el-button>
      <el-button type="primary" :loading="generateLoading" @click="doGenerate">{{ t('goods.generate.start') }}</el-button>
    </template>
  </el-dialog>

  <!-- TTS弹窗 -->
  <el-dialog v-model="ttsVisible" :width="isMobile ? '94vw' : '600px'" :title="t('goods.tts.title')" destroy-on-close>
    <el-form label-width="auto">
      <el-form-item :label="t('goods.form.script_text')">
        <el-input v-model="ttsScriptText" type="textarea" :rows="6" :placeholder="t('goods.tts.placeholder')" />
      </el-form-item>
      <el-form-item v-if="ttsRow.audio_url" :label="t('goods.tts.currentAudio')">
        <audio :src="ttsRow.audio_url" controls style="width:100%" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="ttsVisible = false">{{ t('common.actions.cancel') }}</el-button>
      <el-button type="primary" :loading="ttsLoading" @click="doTts">{{ t('goods.tts.start') }}</el-button>
    </template>
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
.hint-text { color: var(--el-text-color-secondary); font-size: 13px; margin-bottom: 12px }

/* 详情弹窗：固定高度 + 内部滚动 */
:deep(.detail-dialog .el-dialog__body) {
  padding: 0;
  overflow: hidden;
}
.detail-body {
  max-height: 65vh;
  overflow-y: auto;
  padding: 16px 20px;
}
/* 链接截断由 el-text truncated 处理 */

.detail-section-title {
  font-weight: 600; font-size: 14px; margin: 16px 0 8px; padding-left: 8px;
  border-left: 3px solid var(--el-color-primary);
}
.detail-text-block {
  background: var(--el-fill-color-light); padding: 12px; border-radius: 6px;
  white-space: pre-wrap; word-break: break-all; font-size: 13px; line-height: 1.6;
}
.image-grid { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 8px }
.image-select-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)); gap: 8px }
.image-select-item {
  position: relative; aspect-ratio: 1; border-radius: 6px; overflow: hidden;
  cursor: pointer; border: 2px solid transparent; transition: border-color .2s;
}
.image-select-item.selected { border-color: var(--el-color-primary) }
.image-check {
  position: absolute; top: 4px; right: 4px; width: 22px; height: 22px;
  background: var(--el-color-primary); color: #fff; border-radius: 50%;
  display: flex; align-items: center; justify-content: center; font-size: 12px;
}
.platform-grid {
  display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 16px;
}
.platform-card {
  display: flex; flex-direction: column; align-items: center; gap: 8px;
  padding: 20px 12px; border-radius: 10px; cursor: pointer;
  background: var(--el-fill-color-light); transition: all .2s;
}
.platform-card:hover { background: var(--el-color-primary-light-9); transform: translateY(-2px) }
.platform-img { width: 48px; height: 48px; border-radius: 8px; object-fit: contain }
.platform-name { font-size: 14px; font-weight: 500 }
.platform-hint {
  margin-top: 16px; font-size: 12px; color: var(--el-text-color-secondary); text-align: center;
}

/* ==================== 移动端适配 ==================== */
@media (max-width: 768px) {
  .detail-body { max-height: 70vh; padding: 12px }
  .detail-section-title { font-size: 13px; margin: 12px 0 6px }
  .detail-text-block { padding: 8px; font-size: 12px }
  .image-grid :deep(.el-image) { width: 60px !important; height: 60px !important }
  .image-select-grid { grid-template-columns: repeat(auto-fill, minmax(72px, 1fr)); gap: 6px }
  .platform-grid { grid-template-columns: repeat(3, 1fr); gap: 10px }
  .platform-card { padding: 14px 8px }
  .platform-img { width: 36px; height: 36px }
  .platform-name { font-size: 12px }
}
</style>
