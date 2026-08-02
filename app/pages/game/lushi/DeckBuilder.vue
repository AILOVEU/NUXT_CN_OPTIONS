<template>
  <div class="deck-builder">
    <div class="db-heroes">
      <span class="dh-label">出战英雄：</span>
      <div
        v-for="h in HEROES"
        :key="h.id"
        class="dh-opt"
        :class="{ active: heroId === h.id }"
        @click="heroId = h.id"
      >
        <img v-if="heroArt(h.id)" :src="heroArt(h.id)" :alt="h.name" class="dh-img" />
        <div v-else class="dh-pf">{{ h.name[0] }}</div>
        <span class="dh-name">{{ h.name }}</span>
      </div>
    </div>
    <div class="db-left">
      <div class="db-toolbar">
        <input v-model="keyword" class="db-input" placeholder="搜索卡牌名称 / 描述" />
        <select v-model="filterType" class="db-select">
          <option value="">全部类型</option>
          <option value="minion">随从</option>
          <option value="spell">法术</option>
          <option value="weapon">武器</option>
        </select>
        <select v-model="filterCost" class="db-select">
          <option value="">全部费用</option>
          <option v-for="c in costOptions" :key="c" :value="String(c)">{{ c === 7 ? '7+' : c }} 费</option>
        </select>
      </div>
      <div class="db-pool">
        <div v-for="card in filtered" :key="card.id" class="pool-item" @click="add(card.id)">
          <GameCard :card="card" mode="mini" playable />
          <div class="own" :class="{ full: countOf(card.id) >= limitOf(card) }">
            {{ countOf(card.id) }} / {{ limitOf(card) }}
          </div>
        </div>
        <div v-if="filtered.length === 0" class="db-empty">没有匹配的卡牌</div>
      </div>
    </div>

    <div class="db-right">
      <div class="db-head">
        <span class="db-title">我的牌组</span>
        <span class="db-count" :class="{ ok: total === deckSize }">{{ total }} / {{ deckSize }}</span>
      </div>

      <div class="db-curve">
        <div v-for="(n, i) in curve" :key="i" class="curve-col" :title="`${i === 7 ? '7+' : i} 费：${n} 张`">
          <div class="bar" :style="{ height: barHeight(n) }"></div>
          <span>{{ i === 7 ? '7+' : i }}</span>
        </div>
      </div>

      <div class="db-list">
        <div v-for="row in deckRows" :key="row.id" class="deck-row" @click="remove(row.id)">
          <span class="dr-cost">{{ row.cost }}</span>
          <span class="dr-name" :style="{ color: rarityColor(row.rarity) }">{{ row.name }}</span>
          <span class="dr-count">×{{ row.count }}</span>
        </div>
        <div v-if="deckRows.length === 0" class="db-empty">牌组为空，从左侧点击卡牌加入</div>
      </div>

      <div v-if="errors.length" class="db-errors">
        <div v-for="(e, i) in errors" :key="i">· {{ e }}</div>
      </div>

      <div class="db-actions">
        <button class="btn ghost" @click="loadDefault">预设牌组</button>
        <button class="btn ghost" @click="loadRandom">随机补满</button>
        <button class="btn ghost danger" @click="clearAll">清空</button>
        <button class="btn ghost" @click="emit('cancel')">返回</button>
        <button class="btn primary" :disabled="errors.length > 0" @click="save">保存牌组</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from "vue";
import GameCard from "./GameCard.vue";
import { CARD_POOL, DECK_SIZE, MAX_COPIES, RARITY_COLOR, ART_BASE, HEROES, getCardById, defaultDeck } from "./cards.js";
import { validateDeck, randomDeck } from "./engine.js";

const props = defineProps({
  initial: { type: Array, default: () => [] },
  heroId: { type: String, default: "" },
});
const emit = defineEmits(["saved", "cancel"]);

const deckSize = DECK_SIZE;
const deck = ref(props.initial.slice());
const heroId = ref(props.heroId);
watch(
  () => props.initial,
  (v) => {
    deck.value = (v || []).slice();
  }
);

function heroArt(id) {
  const h = HEROES.find((x) => x.id === id);
  return h && h.art ? ART_BASE + h.art : "";
}
watch(
  () => props.modelValue,
  (v) => {
    deck.value = (v || []).slice();
  }
);

const keyword = ref("");
const filterType = ref("");
const filterCost = ref("");
const costOptions = [0, 1, 2, 3, 4, 5, 6, 7];

const filtered = computed(() => {
  const kw = keyword.value.trim();
  return CARD_POOL.filter((c) => {
    if (c.token) return false;
    if (filterType.value && c.type !== filterType.value) return false;
    if (filterCost.value !== "") {
      const fc = Number(filterCost.value);
      if (fc === 7 ? c.cost < 7 : c.cost !== fc) return false;
    }
    if (kw && !(c.name.includes(kw) || (c.text || "").includes(kw))) return false;
    return true;
  }).sort((a, b) => a.cost - b.cost || a.name.localeCompare(b.name, "zh"));
});

const counts = computed(() => {
  const m = {};
  for (const id of deck.value) m[id] = (m[id] || 0) + 1;
  return m;
});
const total = computed(() => deck.value.length);

const deckRows = computed(() =>
  Object.entries(counts.value)
    .map(([id, count]) => {
      const def = getCardById(id);
      return { id, count, name: def?.name || id, cost: def?.cost ?? 0, rarity: def?.rarity || "common" };
    })
    .sort((a, b) => a.cost - b.cost || a.name.localeCompare(b.name, "zh"))
);

const curve = computed(() => {
  const arr = new Array(8).fill(0);
  for (const id of deck.value) {
    const def = getCardById(id);
    if (!def) continue;
    arr[Math.min(7, def.cost)] += 1;
  }
  return arr;
});

const errors = computed(() => validateDeck(deck.value, DECK_SIZE, MAX_COPIES));

function barHeight(n) {
  const max = Math.max(1, ...curve.value);
  return `${Math.round((n / max) * 100)}%`;
}
function rarityColor(r) {
  return RARITY_COLOR[r] || "#eee";
}
function limitOf(card) {
  return card.rarity === "legendary" ? 1 : MAX_COPIES;
}
function countOf(id) {
  return counts.value[id] || 0;
}
function sync() {
  emit("update:modelValue", deck.value.slice());
}
function add(id) {
  const def = getCardById(id);
  if (!def) return;
  if (deck.value.length >= DECK_SIZE) return;
  if (countOf(id) >= limitOf(def)) return;
  deck.value.push(id);
  sync();
}
function remove(id) {
  const i = deck.value.lastIndexOf(id);
  if (i >= 0) {
    deck.value.splice(i, 1);
    sync();
  }
}
function clearAll() {
  deck.value = [];
  sync();
}
function loadDefault() {
  deck.value = defaultDeck();
  sync();
}
function loadRandom() {
  const need = DECK_SIZE - deck.value.length;
  if (need <= 0) return;
  const extra = randomDeck(DECK_SIZE);
  for (const id of extra) {
    if (deck.value.length >= DECK_SIZE) break;
    const def = getCardById(id);
    if (countOf(id) >= limitOf(def)) continue;
    deck.value.push(id);
  }
  sync();
}
function save() {
  if (errors.value.length) return;
  emit("saved", deck.value.slice(), heroId.value);
}
</script>

<style scoped lang="less">
.deck-builder {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  height: 100%;
  min-height: 100vh;
  padding: 14px;
  background: radial-gradient(circle at 50% 0%, #2a1838 0%, #140d1f 60%, #0a0710 100%);
  box-sizing: border-box;
}
.db-heroes {
  flex: 1 1 100%;
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid #6d5a3d;
  border-radius: 10px;
  padding: 8px 12px;
}
.dh-label { color: #ffd54f; font-size: 13px; font-weight: 700; }
.dh-opt {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  border-radius: 8px;
  border: 2px solid transparent;
  background: rgba(255, 255, 255, 0.06);
  cursor: pointer;
  transition: transform 0.12s, border-color 0.12s;
}
.dh-opt:hover { transform: translateY(-2px); background: rgba(255, 255, 255, 0.12); }
.dh-opt.active { border-color: #ffd54f; box-shadow: 0 0 12px rgba(255, 213, 79, 0.4); }
.dh-img { width: 34px; height: 46px; border-radius: 6px; object-fit: cover; object-position: top center; border: 1px solid #7e57c2; }
.dh-pf { width: 34px; height: 46px; border-radius: 6px; display: flex; align-items: center; justify-content: center; font-size: 18px; font-weight: 700; background: #1a1422; }
.dh-name { font-size: 13px; color: #f3e6cf; }
.db-left {
  flex: 1 1 auto;
  min-width: 0;
  display: flex;
  flex-direction: column;
  min-height: 0;
}
.db-right {
  flex: 0 0 280px;
  display: flex;
  flex-direction: column;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid #6d5a3d;
  border-radius: 10px;
  padding: 10px;
  min-height: 0;
}
.db-toolbar {
  display: flex;
  gap: 8px;
  margin-bottom: 10px;
}
.db-input,
.db-select {
  background: rgba(0, 0, 0, 0.35);
  border: 1px solid #6d5a3d;
  color: #f3e6cf;
  border-radius: 6px;
  padding: 6px 8px;
  font-size: 12px;
  outline: none;
  line-height: 1.4;
}
.db-input {
  flex: 1 1 auto;
}
.db-select option {
  background: #2d2318;
}
.db-pool {
  flex: 1 1 auto;
  overflow-y: auto;
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-content: flex-start;
  padding: 6px 4px 10px;
}
.pool-item {
  position: relative;
}
.own {
  text-align: center;
  font-size: 11px;
  color: #cdbb96;
  margin-top: 4px;
}
.own.full {
  color: #ef5350;
}
.db-empty {
  color: #a3906f;
  font-size: 12px;
  padding: 12px;
}

.db-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}
.db-title {
  font-size: 14px;
  font-weight: 700;
  color: #ffd54f;
}
.db-count {
  font-size: 13px;
  color: #ef9a9a;
}
.db-count.ok {
  color: #81c784;
}
.db-curve {
  display: flex;
  align-items: flex-end;
  gap: 4px;
  height: 52px;
  margin-bottom: 8px;
}
.curve-col {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  align-items: center;
  height: 100%;
  font-size: 9px;
  color: #a3906f;
}
.curve-col .bar {
  width: 100%;
  background: linear-gradient(180deg, #64b5f6, #1565c0);
  border-radius: 2px 2px 0 0;
  min-height: 2px;
}
.db-list {
  flex: 1 1 auto;
  overflow-y: auto;
  min-height: 0;
}
.deck-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 6px;
  margin-bottom: 3px;
  background: rgba(255, 255, 255, 0.06);
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
}
.deck-row:hover {
  background: rgba(239, 83, 80, 0.25);
}
.dr-cost {
  width: 18px;
  height: 18px;
  line-height: 17px;
  text-align: center;
  border-radius: 50%;
  background: #1565c0;
  color: #fff;
  font-size: 11px;
  flex: 0 0 auto;
}
.dr-name {
  flex: 1 1 auto;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.dr-count {
  color: #ffd54f;
}
.db-errors {
  font-size: 11px;
  color: #ef9a9a;
  margin: 6px 0;
  line-height: 1.5;
}
.db-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 8px;
}
.btn {
  border: 1px solid #8d7350;
  background: rgba(255, 255, 255, 0.08);
  color: #f3e6cf;
  padding: 6px 10px;
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
  line-height: 1.4;
}
.btn:hover {
  background: rgba(255, 255, 255, 0.16);
}
.btn.primary {
  background: linear-gradient(180deg, #f9a825, #ef6c00);
  border-color: #ffcc80;
  color: #2b1a00;
  font-weight: 700;
  flex: 1 1 100%;
}
.btn.primary:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}
.btn.danger:hover {
  background: rgba(239, 83, 80, 0.3);
}
</style>
