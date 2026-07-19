<script setup lang="ts">
import { DIcon } from '@/components/DIcon'

// DIcon 演示
const iconExamples = [
  {type: 'Element Plus', icon: 'UserFilled', desc: 'Element Plus 用户图标'},
  {type: 'Element Plus', icon: 'Setting', desc: 'Element Plus 设置图标'},
  {type: 'Element Plus', icon: 'HomeFilled', desc: 'Element Plus 首页图标'},
  {type: 'Iconify', icon: 'mdi:account', desc: 'Material Design Icons 用户'},
  {type: 'Iconify', icon: 'carbon:user', desc: 'Carbon 用户图标'},
  {type: 'Iconify', icon: 'lucide:home', desc: 'Lucide 首页图标'},
  {type: 'Iconify', icon: 'heroicons:cog-6-tooth', desc: 'Heroicons 设置图标'},
]

const dIconProps = [
  {name: 'icon', type: 'String', default: "''", desc: '图标名称（Element Plus 组件名或 Iconify 格式）'},
  {name: 'size', type: 'Number/String', default: '18', desc: '图标大小（像素）'}
]
</script>

<template>
  <el-tab-pane
    label="DIcon 图标"
    name="DIcon"
  >
    <div class="demo-section">
      <h4>基础用法</h4>
      <div class="demo-block">
        <el-space
          :size="24"
          wrap
        >
          <div
            v-for="item in iconExamples"
            :key="item.icon"
            style="text-align: center;"
          >
            <DIcon
              :icon="item.icon"
              :size="32"
            />
            <div style="margin-top: 8px; font-size: 12px; color: var(--el-text-color-secondary);">
              {{ item.desc }}
            </div>
            <el-tag
              size="small"
              style="margin-top: 4px;"
            >
              {{ item.type }}
            </el-tag>
          </div>
        </el-space>
      </div>
      <div class="demo-code">
        <el-text type="info">
          &lt;DIcon icon="UserFilled" :size="24" /&gt;
        </el-text>
        <br>
        <el-text type="info">
          &lt;DIcon icon="mdi:account" :size="24" /&gt;
        </el-text>
      </div>
    </div>

    <div class="demo-section">
      <h4>不同尺寸</h4>
      <div class="demo-block">
        <el-space
          :size="24"
          align="center"
        >
          <div style="text-align: center;">
            <DIcon
              icon="UserFilled"
              :size="16"
            />
            <div style="margin-top: 4px; font-size: 12px;">
              16px
            </div>
          </div>
          <div style="text-align: center;">
            <DIcon
              icon="mdi:account"
              :size="24"
            />
            <div style="margin-top: 4px; font-size: 12px;">
              24px
            </div>
          </div>
          <div style="text-align: center;">
            <DIcon
              icon="carbon:user"
              :size="32"
            />
            <div style="margin-top: 4px; font-size: 12px;">
              32px
            </div>
          </div>
          <div style="text-align: center;">
            <DIcon
              icon="lucide:user"
              :size="48"
            />
            <div style="margin-top: 4px; font-size: 12px;">
              48px
            </div>
          </div>
        </el-space>
      </div>
    </div>

    <div class="demo-section">
      <h4>Attributes</h4>
      <el-table
        :data="dIconProps"
        border
      >
        <el-table-column
          prop="name"
          label="属性名"
          width="200"
        />
        <el-table-column
          prop="type"
          label="类型"
          width="140"
        />
        <el-table-column
          prop="default"
          label="默认值"
          width="120"
        />
        <el-table-column
          prop="desc"
          label="说明"
        />
      </el-table>
    </div>

    <div class="demo-section">
      <h4>特性</h4>
      <el-alert
        type="info"
        :closable="false"
      >
        <ul style="margin: 0; padding-left: 20px;">
          <li>自动识别 Element Plus 和 Iconify 图标格式</li>
          <li>Element Plus 格式：直接使用组件名（如 UserFilled）</li>
          <li>Iconify 格式：使用 "前缀:名称" 格式（如 mdi:account）</li>
          <li>支持自定义尺寸</li>
          <li>统一的 API，无需关心底层实现</li>
        </ul>
      </el-alert>
    </div>

    <div class="demo-section">
      <h4>使用场景</h4>
      <el-alert
        type="success"
        :closable="false"
      >
        <ul style="margin: 0; padding-left: 20px;">
          <li>菜单图标：左侧导航菜单</li>
          <li>按钮图标：操作按钮前缀图标</li>
          <li>列表图标：表格列中的图标展示</li>
          <li>状态图标：各种状态指示图标</li>
        </ul>
      </el-alert>
    </div>
  </el-tab-pane>
</template>

<style scoped src="./pane.styles.css"></style>
