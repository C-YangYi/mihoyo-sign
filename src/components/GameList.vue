<template>
  <div class="game-list">
    <div v-for="(game, key) in games" :key="key" class="game-row">
      <img class="game-icon" :src="game.icon" alt="">
      <span class="game-name">{{ game.name }}</span>
      <span class="game-uid" v-if="game.uid">uid:{{ game.uid }}</span>
    </div>
  </div>
</template>

<script setup>
defineProps({ games: { type: Object, required: true } });
</script>

<style scoped>
.game-row { display: flex; align-items: center; gap: 12px; padding: 14px 16px; background: #fff; border-radius: 8px; border: 1px solid #e8e8e8; }
.game-icon { width: 28px; height: 28px; }
.game-name { flex: 1; font-size: 15px; color: #333; }
.game-list { display: flex; flex-direction: column; gap: 10px; }
.game-uid { font-size: 13px; color: #999; }
</style>
