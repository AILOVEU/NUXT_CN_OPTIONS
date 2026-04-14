<template>
  <div class="flex justify-evenly">
    <!-- 认购 -->
    <div class="flex flex-col items-center">
      <div>认购</div>
      <br /><br />
      <div class="flex items-center justify-center">
        <Statistic title="认购总价" :value="formatNumberToWan(认购总价)" />
        <div class="mx-[2px]">&nbsp;</div>
        <Statistic title="认购内在价总和" :value="formatNumberToWan(认购内在价总和)" />
        <div class="mx-[2px]">&nbsp;</div>
        <Statistic title="认购时间价占比" :value="formatDecimal(认购时间价占比, 2) + '%'" :style="{ backgroundColor: '#ece7d1' }" />
        <div class="mx-[2px]">&nbsp;</div>
        <Statistic title="认购总杠杆" :value="认购总杠杆" />
      </div>
      <br /><br />
      <div class="flex items-center justify-center">
        <Statistic title="认购代替正股总和" :value="formatNumberToWan(认购代替正股总和)" />
        <div class="mx-[2px]">|</div>
        <Statistic title="认购总手数" :value="formatNumberToWan(认购总手数)" />
        <div class="mx-[2px]">|</div>
        <Statistic title="认购单笔期权平均价" :value="formatNumberToWan(认购单笔期权平均价)" />
        <div class="mx-[2px]">|</div>
        <Statistic title="认购平均Delta" :value="formatNumberToWan(认购平均Delta)" />
      </div>
    </div>
    <!-- 认沽 -->
    <div class="flex flex-col items-center">
      <div>认沽</div>
      <br /><br />
      <div class="flex items-center justify-center">
        <Statistic title="认沽总价" :value="formatNumberToWan(认沽总价)" />
        <div class="mx-[2px]">&nbsp;</div>
        <Statistic title="认沽内在价总和" :value="formatNumberToWan(认沽内在价总和)" />
        <div class="mx-[2px]">&nbsp;</div>
        <Statistic title="认沽时间价占比" :value="formatDecimal(认沽时间价占比, 2) + '%'" :style="{ backgroundColor: '#ece7d1' }" />
        <div class="mx-[2px]">&nbsp;</div>
        <Statistic title="认沽总杠杆" :value="认沽总杠杆" />
      </div>
      <br /><br />
      <div class="flex items-center justify-center">
        <Statistic title="认沽代替正股总和" :value="formatNumberToWan(认沽代替正股总和)" />
        <div class="mx-[2px]">|</div>
        <Statistic title="认沽总手数" :value="formatNumberToWan(认沽总手数)" />
        <div class="mx-[2px]">|</div>
        <Statistic title="认沽单笔期权平均价" :value="formatNumberToWan(认沽单笔期权平均价)" />
        <div class="mx-[2px]">|</div>
        <Statistic title="认沽平均Delta" :value="formatNumberToWan(认沽平均Delta)" />
      </div>
    </div>
  </div>
  <br /><br />
  <br /><br />
  <div class="flex items-center justify-center">
    <Statistic title="认沽对冲占比" :value="Math.abs(formatDecimal(认沽对冲占比, 2)) + '%'" :style="{ backgroundColor: Math.abs(认沽对冲占比) > 10 ? '#BCD9A2' : '#FFA6A6' }" />
    <div class="mx-[2px]">&nbsp;</div>
    <Statistic title="代替正股总和" :value="formatNumberToWan(代替正股总和)" />
    <div class="mx-[2px]">&nbsp;</div>
    <Statistic title="持仓总和" :value="formatNumberToWan(持仓总和)" />
  </div>
  <br /><br />

  <div class="flex items-center justify-center">
    <Statistic title="涨跌1%盈亏" :value="formatNumberToWan(formatDecimal(代替正股总和 * 0.01, 0))" />
    <div class="mx-[2px]">&nbsp;</div>
    <Statistic title="涨跌2%盈亏" :value="formatNumberToWan(formatDecimal(代替正股总和 * 0.02, 0))" />
    <div class="mx-[2px]">&nbsp;</div>
    <Statistic title="时间价总和" :value="formatNumberToWan(时间价总和)" />
    <div class="mx-[2px]">&nbsp;</div>
    <Statistic title="时间价占比" :value="formatDecimal(时间价占比, 2) + '%'" :style="{ backgroundColor: '#ece7d1' }" />
    <div class="mx-[2px]">&nbsp;</div>
    <Statistic title="总杠杆" :value="总杠杆" :style="{ backgroundColor: '#ece7d1' }" />
  </div>
</template>
<script setup>
import { formatDecimal, formatNumberToWan } from "~/utils/utils";
const props = defineProps(["tiledData", "comboList"]);
const 非组合TiledData = computed(() => {
  return props.tiledData.filter((el) => !el["组合"]);
});

const 认购总价 = computed(() => {
  let sum = 0;
  非组合TiledData.value
    .filter((el) => el["沽购"] === "购")
    .filter((el) => el["持仓"])
    .forEach((el) => {
      sum += el["持仓"] * el["一手价"];
    });
  return sum;
});

const 认沽总价 = computed(() => {
  let sum = 0;
  非组合TiledData.value
    .filter((el) => el["沽购"] === "沽")
    .filter((el) => el["持仓"])
    .forEach((el) => {
      sum += el["持仓"] * el["一手价"];
    });
  return sum;
});

const 内在价总和 = computed(() => {
  let sum = 0;
  非组合TiledData.value
    .filter((el) => el["持仓"])
    .forEach((el) => {
      sum += el["持仓"] * el["一手内在价"];
    });
  return sum;
});
const 时间价总和 = computed(() => {
  let sum = 0;
  非组合TiledData.value
    .filter((el) => el["持仓"])
    .forEach((el) => {
      sum += el["持仓"] * el["一手时间价"];
    });
  return sum;
});

const 认购内在价总和 = computed(() => {
  let sum = 0;
  非组合TiledData.value
    .filter((el) => el["沽购"] === "购")
    .filter((el) => el["持仓"])
    .forEach((el) => {
      sum += el["持仓"] * el["一手内在价"];
    });
  return sum;
});
const 认购时间价总和 = computed(() => {
  let sum = 0;
  非组合TiledData.value
    .filter((el) => el["沽购"] === "购")
    .filter((el) => el["持仓"])
    .forEach((el) => {
      sum += el["持仓"] * el["一手时间价"];
    });
  return sum;
});

const 认沽内在价总和 = computed(() => {
  let sum = 0;
  非组合TiledData.value
    .filter((el) => el["沽购"] === "沽")
    .filter((el) => el["持仓"])
    .forEach((el) => {
      sum += el["持仓"] * el["一手内在价"];
    });
  return sum;
});
const 认沽时间价总和 = computed(() => {
  let sum = 0;
  非组合TiledData.value
    .filter((el) => el["沽购"] === "沽")
    .filter((el) => el["持仓"])
    .forEach((el) => {
      sum += el["持仓"] * el["一手时间价"];
    });
  return sum;
});

const 代替正股总和 = computed(() => {
  let sum = 0;
  非组合TiledData.value
    .filter((el) => el["持仓"])
    .forEach((el) => {
      sum += el["持仓"] * el["代替正股价"];
    });
  return formatDecimal(sum, 0);
});
const 认购代替正股总和 = computed(() => {
  let sum = 0;
  非组合TiledData.value
    .filter((el) => el["沽购"] === "购")
    .filter((el) => el["持仓"])
    .forEach((el) => {
      sum += el["持仓"] * el["代替正股价"];
    });
  return formatDecimal(sum, 0);
});
const 认沽代替正股总和 = computed(() => {
  let sum = 0;
  非组合TiledData.value
    .filter((el) => el["沽购"] === "沽")
    .filter((el) => el["持仓"])
    .forEach((el) => {
      sum += el["持仓"] * el["代替正股价"];
    });
  return formatDecimal(sum, 0);
});

const 认沽对冲占比 = computed(() => {
  let val = (认沽代替正股总和.value / (Math.abs(认购代替正股总和.value) + Math.abs(认沽代替正股总和.value))) * 100;
  return Math.abs(val);
});
const 持仓总和 = computed(() => {
  let sum = 0;
  非组合TiledData.value
    .filter((el) => el["持仓"])
    .forEach((el) => {
      sum += el["持仓"] * el["一手价"];
    });
  return sum;
});

const 认购持仓总和 = computed(() => {
  let sum = 0;
  非组合TiledData.value
    .filter((el) => el["沽购"] === "购")
    .filter((el) => el["持仓"])
    .forEach((el) => {
      sum += el["持仓"] * el["一手价"];
    });
  return sum;
});
const 认沽持仓总和 = computed(() => {
  let sum = 0;
  非组合TiledData.value
    .filter((el) => el["沽购"] === "沽")
    .filter((el) => el["持仓"])
    .forEach((el) => {
      sum += el["持仓"] * el["一手价"];
    });
  return sum;
});

const 时间价占比 = computed(() => {
  let val = (时间价总和.value / (时间价总和.value + 内在价总和.value)) * 100;
  return val;
});

const 认购时间价占比 = computed(() => {
  let val = (认购时间价总和.value / (认购时间价总和.value + 认购内在价总和.value)) * 100;
  return val;
});

const 认沽时间价占比 = computed(() => {
  let val = (认沽时间价总和.value / (认沽时间价总和.value + 认沽内在价总和.value)) * 100;
  return val;
});
const 总杠杆 = computed(() => {
  let val = 代替正股总和.value / 持仓总和.value;
  return formatDecimal(val, 2);
});
const 认购总杠杆 = computed(() => {
  let val = 认购代替正股总和.value / 认购持仓总和.value;
  return formatDecimal(val, 2);
});
const 认沽总杠杆 = computed(() => {
  let val = 代替正股总和.value / 认沽持仓总和.value;
  return formatDecimal(val, 2);
});

const 总手数 = computed(() => {
  let 总手数 = 0;
  非组合TiledData.value.forEach((el) => {
    总手数 += el["持仓"];
  });
  return 总手数 || 0;
});

const 认购总手数 = computed(() => {
  let 总手数 = 0;
  非组合TiledData.value
    .filter((el) => el["沽购"] === "购")
    .filter((el) => el["持仓"])
    .forEach((el) => {
      总手数 += el["持仓"];
    });
  return 总手数 || 0;
});

const 认沽总手数 = computed(() => {
  let 总手数 = 0;
  非组合TiledData.value
    .filter((el) => el["沽购"] === "沽")
    .filter((el) => el["持仓"])
    .forEach((el) => {
      总手数 += el["持仓"];
    });
  return 总手数 || 0;
});

const 认购单笔期权平均价 = computed(() => {
  const res = 认购持仓总和.value / (认购总手数.value || 1);
  return formatDecimal(res, 0);
});

const 认沽单笔期权平均价 = computed(() => {
  const res = 认沽持仓总和.value / (认沽总手数.value || 1);
  return formatDecimal(res, 0);
});

const 认购平均Delta = computed(() => {
  let 总手数 = 0;
  let 总Delta = 0;
  非组合TiledData.value
    .filter((el) => el["沽购"] === "购")
    .filter((el) => el["持仓"])
    .forEach((el) => {
      总手数 += el["持仓"];
      总Delta += el["持仓"] * el["Delta"];
    });
  if (!总手数) return 0;
  const res = 总Delta / 总手数;
  return formatDecimal(res, 2);
});

const 认沽平均Delta = computed(() => {
  let 总手数 = 0;
  let 总Delta = 0;
  非组合TiledData.value
    .filter((el) => el["沽购"] === "沽")
    .filter((el) => el["持仓"])
    .forEach((el) => {
      总手数 += el["持仓"];
      总Delta += el["持仓"] * el["Delta"];
    });
  if (!总手数) return 0;
  const res = 总Delta / 总手数;
  return formatDecimal(res, 2);
});
</script>
