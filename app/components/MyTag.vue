<template>
  <span class="my-tag my-tag-wrapper whitespace-nowrap inline-block px-[2px] pt-[1px] pb-[4px] rounded-md font-medium text-[14px]" :style="wrapperStyle" v-if="props.label || isValidVal">
    <span v-if="props.label" class="my-tag my-tag-label whitespace-nowrap inline-block mr-[2px]" style="font-size: 0.6em" :style="contentStyle">{{ props.label }}</span>
    <span class="my-tag my-tag-value whitespace-nowrap inline-block ml-[1px]" v-if="isValidVal" :style="contentStyle"><slot></slot></span>
    <span class="my-tag my-tag-value whitespace-nowrap inline-block ml-[1px]" v-else>--</span>
  </span>
</template>

<script setup>
const props = defineProps(["label", "value", "cfg"]);
const isValidVal = computed(() => {
  if (isNaN(props.value)) return false;
  if (props.value == undefined) return false;
  if (props.value === "") return false;
  return true;
});
const colorStyleMap = {
  black: {
    color: "black",
    background: "rgba(222,222,222,0.25)",
  },
  blue: {
    color: "#409eff",
    background: "rgba(222,222,222,0.25)",
  },
  "bg-blue": {
    color: "white",
    background: "#409eff",
  },
  green: {
    color: "#0a8937",
    background: "rgba(222,222,222,0.25)",
  },
  "bg-green": {
    color: "white",
    background: "#0a8937",
  },
  red: {
    color: "#fd000f",
    background: "rgba(222,222,222,0.25)",
  },
  "bg-red": {
    color: "white",
    background: "#fd000f",
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
