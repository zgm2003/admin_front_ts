<script setup>
import { defineAsyncComponent, ref } from 'vue'
import ParticleBackground from '@/components/ParticleBackground'
const LoginVue = defineAsyncComponent({ loader: () => import('./components/Login.vue') })
const RegisterVue = defineAsyncComponent({ loader: () => import('./components/Register.vue') })
const currentView = ref('login')
const toRegister = () => { currentView.value = 'register' }
const toLogin = () => { currentView.value = 'login' }
</script>
<template>
  <div class="box">
    <ParticleBackground />
    <LoginVue v-if="currentView === 'login'" @to-register="toRegister" />
    <RegisterVue v-if="currentView === 'register'" @to-login="toLogin" />
  </div>
  </template>
<style scoped lang="scss">
.box{ min-height:100vh; display:flex; align-items:center; justify-content:center; background:
  radial-gradient(1000px 600px at 10% 10%, #f6f9ff 0%, #eef2f9 35%, #e9edf5 100%),
  radial-gradient(800px 500px at 90% 90%, #f3f7ff 0%, #edf1f7 40%, transparent 70%),
  repeating-linear-gradient(0deg, rgba(0,0,0,0.02) 0px, rgba(0,0,0,0.02) 1px, transparent 1px, transparent 12px),
  repeating-linear-gradient(90deg, rgba(0,0,0,0.02) 0px, rgba(0,0,0,0.02) 1px, transparent 1px, transparent 12px);
  background-attachment: fixed; padding:16px }
:global(.dark) .box{ background:
  radial-gradient(1000px 600px at 12% 10%, #0f1218 0%, #10141a 40%, #0b0e13 100%),
  radial-gradient(900px 600px at 85% 92%, #11161d 0%, #0e1217 40%, transparent 70%),
  repeating-linear-gradient(0deg, rgba(255,255,255,0.03) 0px, rgba(255,255,255,0.03) 1px, transparent 1px, transparent 12px),
  repeating-linear-gradient(90deg, rgba(255,255,255,0.03) 0px, rgba(255,255,255,0.03) 1px, transparent 1px, transparent 12px) }
</style>
