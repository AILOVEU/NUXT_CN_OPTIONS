<template>
  <div class="my-tag-wrapper whitespace-nowrap inline-block px-[2px] pb-[4px] rounded-md" :style="wrapperStyle">
    <div class="my-tag-label whitespace-nowrap inline-block transform origin-left scale-[0.65]" :style="contentStyle">{{ props.label }}</div>
    <div class="my-tag-value whitespace-nowrap inline-block ml-[1px]" v-if="isValidVal" :style="contentStyle"><slot></slot></div>
    <div class="my-tag-value whitespace-nowrap inline-block ml-[1px]" v-else>--</div>
  </div>
</template>

<script setup>
const props = defineProps(["label", "value", "cfg"]);
const isValidVal = computed(() => {
  if (isNaN(props.value)) return false;
  if (props.value == undefined) return false;
  return true;
});
const colorStyleMap = {
  black: {
    color: "black",
    background: "#f4f4f5",
  },
  blue: {
    color: "#409eff",
    background: "#f4f4f5",
  },
  "bg-blue": {
    color: "white",
    background: "#409eff",
  },
  green: {
    color: "#70c646",
    background: "#f4f4f5",
  },
  "bg-green": {
    color: "white",
    background: "#70c646",
  },
  orange: {
    color: "#FF9D23",
    background: "#f4f4f5",
  },
  "bg-orange": {
    color: "white",
    background: "#FF9D23",
  },
  red: {
    color: "#f57171",
    background: "#f4f4f5",
  },
  "bg-red": {
    color: "white",
    background: "#f57171",
  },
};
const wrapperStyle = computed(() => {
  let style = {};
  let flag = false;
  const cfg = props.cfg;
  for (let i = 0; i < cfg.length; i++) {
    if (props.value >= cfg[i][0] && props.value <= cfg[i][1]) {
      const colorKey = cfg[i][2];
      style = colorStyleMap[colorKey];
      flag = true;
      break;
    }
  }
  if (!flag) {
    style = colorStyleMap["black"];
  }
  return style;
});
const contentStyle = computed(() => {
  let style = {};
  const cfg = props.cfg;
  for (let i = 0; i < cfg.length; i++) {
    if (props.value >= cfg[i][0] && props.value <= cfg[i][1]) {
      const colorKey = cfg[i][2];
      style = { color: colorStyleMap[colorKey].color };
      break;
    }
  }
  return style;
});
</script>

<style scoped></style>
