<template>
  <button class="btn" :disabled="disabled" @click="$emit('sign')">
    <span v-if="signing" class="spinner"></span>
    {{ signing ? '签到中...' : '一键签到所有游戏' }}
  </button>
</template>

<script setup>
defineProps({
  disabled: Boolean,
  signing: Boolean,
});
defineEmits(['sign']);
</script>

<style scoped>
.btn { margin-top: 12px; padding: 12px; font-size: 16px; font-weight: 600; background: linear-gradient(135deg, #533483, #0f3460); color: #e0e0e0; border: 1px solid #533483; border-radius: 8px; cursor: pointer; letter-spacing: 1px; }
.btn:hover { opacity: 0.9; }
.btn:disabled { opacity: 0.5; cursor: not-allowed; }
.spinner { display: inline-block; width: 16px; height: 16px; border: 2px solid #533483; border-top-color: #e0e0e0; border-radius: 50%; animation: spin 0.8s linear infinite; vertical-align: middle; margin-right: 6px; }
@keyframes spin { to { transform: rotate(360deg); } }
</style>