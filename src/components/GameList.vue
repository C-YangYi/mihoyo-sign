<template>
  <div class="game-list">
    <div v-for="(game, key) in games" :key="key" class="game-row">
      <img class="game-icon" :src="game.icon" alt="">
      <div class="game-info">
        <span class="game-name">{{ game.name }}</span>
        <span class="game-streak" v-if="game.streak">本月已签到{{ game.streak }}次</span>
      </div>
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
.game-info { flex: 1; display: flex; flex-direction: column; }
.game-name { font-size: 15px; color: #333; }
.game-list { display: flex; flex-direction: column; gap: 10px; }
.game-streak { font-size: 12px; color: #999; margin-top: 2px; }
.game-uid { font-size: 12px; color: #fff; background: linear-gradient(135deg, #4a90d9, #357abd); padding: 3px 10px; border-radius: 10px; font-weight: 600; letter-spacing: 0.5px; }
</style>
