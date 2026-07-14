<template>
  <button class="btn" :disabled="disabled" @click="$emit('sign')">
    <span v-if="signing" class="spinner"></span>
    {{ label }}
  </button>
</template>

<script setup>
defineProps({
  disabled: Boolean,
  signing: Boolean,
  label: { type: String, default: '一键签到所有游戏' },
});
defineEmits(['sign']);
</script>

<style scoped>
.btn { margin-top: 12px; padding: 12px; font-size: 16px; font-weight: 600; background: #2d8cf0; color: #fff; border: none; border-radius: 8px; cursor: pointer; letter-spacing: 1px; }
.btn:hover:not(:disabled) { background: #4ba1f5; }
.btn:disabled { opacity: 0.5; cursor: not-allowed; }
.spinner { display: inline-block; width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.3); border-top-color: #fff; border-radius: 50%; animation: spin 0.8s linear infinite; vertical-align: middle; margin-right: 6px; }
@keyframes spin { to { transform: rotate(360deg); } }
</style>
