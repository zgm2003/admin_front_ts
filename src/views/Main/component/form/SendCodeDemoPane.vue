<script setup lang="ts">
import { ref } from 'vue'
import { SendCode } from '@/components/SendCode'

// SendCode 演示
const code = ref('')
const testEmail = ref('test@example.com')
const sendCodeProps = [
  {name: 'v-model', type: 'String', default: "''", desc: '验证码输入值'},
  {name: 'account', type: 'String', default: '-', desc: '发送目标（邮箱/手机号），必填'},
  {name: 'scene', type: 'String', default: '-', desc: "场景：'login'|'bind_phone'|'bind_email'|'change_password'"},
  {name: 'placeholder', type: 'String', default: "''", desc: '输入框占位符'},
  {name: 'sendDisabled', type: 'Boolean', default: 'false', desc: '额外禁用发送按钮条件'},
  {name: 'countdown', type: 'Number', default: '60', desc: '倒计时秒数'},
  {name: 'mobile', type: 'Boolean', default: 'false', desc: '是否强制移动端竖向布局'}
]
</script>

<template>
  <el-tab-pane
    label="SendCode 验证码"
    name="SendCode"
  >
    <div class="demo-section">
      <h4>基础用法</h4>
      <div
        class="demo-block"
        style="max-width: 400px"
      >
        <SendCode
          v-model="code"
          :account="testEmail"
          scene="bind_email"
          placeholder="请输入验证码"
        />
      </div>
      <div class="demo-code">
        <el-text type="info">
          &lt;SendCode v-model="code" account="test@example.com" scene="bind_email" /&gt;
        </el-text>
      </div>
    </div>
    <div class="demo-section">
      <h4>Attributes</h4>
      <el-table
        :data="sendCodeProps"
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
          width="120"
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
  </el-tab-pane>
</template>

<style scoped src="./pane.styles.css"></style>
