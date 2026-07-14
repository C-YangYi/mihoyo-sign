<template>
  <div class="game-list">
    <div v-for="(game, key) in games" :key="key" class="game-row">
      <img class="game-icon" :src="game.icon" alt="">
      <span class="game-name">{{ game.name }}</span>
      <span class="game-status" :class="game.configured ? 'ok' : 'no'">
        {{ game.configured ? '✅ 已配置' : '❌ 未配置' }}
      </span>
    </div>
  </div>
</template>

<script setup>
defineProps({
  games: { type: Object, required: true },
});
</script>

<style scoped>
.game-row { display: flex; align-items: center; gap: 12px; padding: 12px 16px; background: #16213e; border-radius: 8px; border: 1px solid #0f3460; }
.game-icon {  width: 24px; text-align: center; }
.game-name { flex: 1; font-size: 15px; }
.game-list { display: flex; flex-direction: column; gap:12px; }
.game-status { font-size: 13px; padding: 4px 10px; border-radius: 12px; }
.game-status.ok { background: #1b4332; color: #52b788; }
.game-status.no { background: #3c1f1f; color: #e76f6f; }
</style>