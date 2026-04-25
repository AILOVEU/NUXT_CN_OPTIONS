<template>
  <div class="flex justify-evenly gap-[50px] max-md:flex-col">
    <!-- 认购 -->
    <div class="flex flex-col items-center">
      <div class="text-[red]">认购Call</div>
      <br /><br />
      <div class="flex items-center justify-center">
        <Statistic title="认购总杠杆" :value="认购总杠杆" />
        <div class="mx-[2px]">&nbsp;</div>
        <Statistic title="认购单日损耗" :value="formatNumberToWan(认购单日损耗)" />
        <div class="mx-[2px]">&nbsp;</div>
        <Statistic title="认购总手数" :value="formatNumberToWan(认购总手数)" />
      </div>
      <br /><br />
      <div class="flex items-center justify-center">
        <Statistic title="认购平均价" :value="formatNumberToWan(认购平均价)" />
        <div class="mx-[2px]">&nbsp;</div>
        <Statistic title="认购中位价" :value="formatNumberToWan(认购中位价)" />
        <div class="mx-[2px]">&nbsp;</div>
        <Statistic title="认购平均Delta" :value="formatNumberToWan(认购平均Delta)" />
        <div class="mx-[2px]">&nbsp;</div>
        <Statistic title="认购平均溢价" :value="认购平均溢价 + '%'" />
      </div>
    </div>
    <!-- 认沽 -->
    <div class="flex flex-col items-center" v-if="认沽总手数">
      <div class="text-[green]">认沽Put</div>
      <br /><br />
      <div class="flex items-center justify-center">
        <Statistic title="认沽总杠杆" :value="认沽总杠杆" />
        <div class="mx-[2px]">&nbsp;</div>
        <Statistic title="认沽单日损耗" :value="formatNumberToWan(认沽单日损耗)" />
        <div class="mx-[2px]">&nbsp;</div>
        <Statistic title="认沽总手数" :value="formatNumberToWan(认沽总手数)" />
      </div>
      <br /><br />
      <div class="flex items-center justify-center">
        <Statistic title="认沽平均价" :value="formatNumberToWan(认沽平均价)" />
        <div class="mx-[2px]">&nbsp;</div>
        <Statistic title="认沽中位价" :value="formatNumberToWan(认沽中位价)" />
        <div class="mx-[2px]">&nbsp;</div>
        <Statistic title="认沽平均Delta" :value="formatNumberToWan(认沽平均Delta)" />
        <div class="mx-[2px]">&nbsp;</div>
        <Statistic title="认沽平均溢价" :value="认沽平均溢价 + '%'" />
      </div>
    </div>
  </div>
  <br /><br />
  <div class="w-full bg-[gray] h-[10px]">&nbsp;</div>
  <br />

  <div class="mx-auto">
    <div class="w-full mx-auto">
      <PercentBar title="购沽仓位" :list="沽购价格List" />
    </div>
    <br />
    <div class="w-full mx-auto">
      <PercentBar title="沽购代替正股List" :list="沽购代替正股List" />
    </div>
  </div>
  <br /><br />
  <div class="w-full mx-auto">
    <CPScatter :option="沽购持仓价格分布Option" />
  </div>
  <br /><br />
  <div class="flex items-center justify-center">
    <Statistic title="代替正股总和" :value="formatNumberToWan(代替正股总和)" />
    <div class="mx-[2px]">&nbsp;</div>
    <Statistic title="持仓总和" :value="formatNumberToWan(持仓总和)" :style="{ backgroundColor: '#ece7d1' }" />
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
    <div class="mx-[2px]">&nbsp;</div>
    <Statistic title="总单日损耗" :value="总单日损耗" :style="{ backgroundColor: '#ece7d1' }" />
  </div>
</template>
<script setup>
import { formatDecimal, formatNumberToWan, getMedian } from "~/utils/utils";
const props = defineProps(["tiledData", "comboList"]);
const 非组合TiledData = computed(() => {
  return props.tiledData.filter((el) => !el["组合"] && el["持仓"] > 0);
});

const 认购总价 = computed(() => {
  let sum = 0;
  非组合TiledData.value
    .filter((el) => el["沽购"] === "购")
    .forEach((el) => {
      sum += el["持仓"] * el["一手价"];
    });
  return sum;
});

const 认沽总价 = computed(() => {
  let sum = 0;
  非组合TiledData.value
    .filter((el) => el["沽购"] === "沽")
    .forEach((el) => {
      sum += el["持仓"] * el["一手价"];
    });
  return sum;
});

const 内在价总和 = computed(() => {
  let sum = 0;
  非组合TiledData.value.forEach((el) => {
    sum += el["持仓"] * el["一手内在价"];
  });
  return sum;
});
const 时间价总和 = computed(() => {
  let sum = 0;
  非组合TiledData.value.forEach((el) => {
    sum += el["持仓"] * el["一手时间价"];
  });
  return sum;
});

const 认购内在价总和 = computed(() => {
  let sum = 0;
  非组合TiledData.value
    .filter((el) => el["沽购"] === "购")
    .forEach((el) => {
      sum += el["持仓"] * el["一手内在价"];
    });
  return sum;
});
const 认购时间价总和 = computed(() => {
  let sum = 0;
  非组合TiledData.value
    .filter((el) => el["沽购"] === "购")
    .forEach((el) => {
      sum += el["持仓"] * el["一手时间价"];
    });
  return sum;
});

const 认沽内在价总和 = computed(() => {
  let sum = 0;
  非组合TiledData.value
    .filter((el) => el["沽购"] === "沽")
    .forEach((el) => {
      sum += el["持仓"] * el["一手内在价"];
    });
  return sum;
});
const 认沽时间价总和 = computed(() => {
  let sum = 0;
  非组合TiledData.value
    .filter((el) => el["沽购"] === "沽")
    .forEach((el) => {
      sum += el["持仓"] * el["一手时间价"];
    });
  return sum;
});

const 代替正股总和 = computed(() => {
  let sum = 0;
  非组合TiledData.value.forEach((el) => {
    sum += el["持仓"] * el["代替正股价"];
  });
  return formatDecimal(sum, 0);
});
const 认购代替正股总和 = computed(() => {
  let sum = 0;
  非组合TiledData.value
    .filter((el) => el["沽购"] === "购")
    .forEach((el) => {
      sum += el["持仓"] * el["代替正股价"];
    });
  return formatDecimal(sum, 0);
});
const 认沽代替正股总和 = computed(() => {
  let sum = 0;
  非组合TiledData.value
    .filter((el) => el["沽购"] === "沽")
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
  非组合TiledData.value.forEach((el) => {
    sum += el["持仓"] * el["一手价"];
  });
  return sum;
});

const 认购持仓总和 = computed(() => {
  let sum = 0;
  非组合TiledData.value
    .filter((el) => el["沽购"] === "购")
    .forEach((el) => {
      sum += el["持仓"] * el["一手价"];
    });
  return sum;
});
const 认沽持仓总和 = computed(() => {
  let sum = 0;
  非组合TiledData.value
    .filter((el) => el["沽购"] === "沽")
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
    .forEach((el) => {
      总手数 += el["持仓"];
    });
  return 总手数 || 0;
});

const 认沽总手数 = computed(() => {
  let 总手数 = 0;
  非组合TiledData.value
    .filter((el) => el["沽购"] === "沽")
    .forEach((el) => {
      总手数 += el["持仓"];
    });
  return 总手数 || 0;
});

const 认购平均价 = computed(() => {
  const res = 认购持仓总和.value / (认购总手数.value || 1);
  return formatDecimal(res, 0);
});

const 认沽平均价 = computed(() => {
  const res = 认沽持仓总和.value / (认沽总手数.value || 1);
  return formatDecimal(res, 0);
});

const 认购平均Delta = computed(() => {
  let 总手数 = 0;
  let 总Delta = 0;
  非组合TiledData.value
    .filter((el) => el["沽购"] === "购")
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
    .forEach((el) => {
      总手数 += el["持仓"];
      总Delta += el["持仓"] * el["Delta"];
    });
  if (!总手数) return 0;
  const res = 总Delta / 总手数;
  return formatDecimal(res, 2);
});

const 认购单日损耗 = computed(() => {
  let 单日损耗 = 0;
  非组合TiledData.value
    .filter((el) => el["沽购"] === "购")
    .forEach((el) => {
      单日损耗 += el["单日损耗"] * el["持仓"];
    });
  return formatDecimal(单日损耗, 0);
});

const 认沽单日损耗 = computed(() => {
  let 单日损耗 = 0;
  非组合TiledData.value
    .filter((el) => el["沽购"] === "沽")
    .forEach((el) => {
      单日损耗 += el["单日损耗"] * el["持仓"];
    });
  return formatDecimal(单日损耗, 0);
});

const 总单日损耗 = computed(() => {
  return 认购单日损耗.value + 认沽单日损耗.value;
});

const 认购平均溢价 = computed(() => {
  let 溢价率 = 0;
  非组合TiledData.value
    .filter((el) => el["沽购"] === "购")
    .forEach((el) => {
      溢价率 += el["溢价率"] * el["持仓"];
    });
  return formatDecimal(溢价率 / 认购总手数.value, 1);
});

const 认沽平均溢价 = computed(() => {
  let 溢价率 = 0;
  非组合TiledData.value
    .filter((el) => el["沽购"] === "沽")
    .forEach((el) => {
      溢价率 += el["溢价率"] * el["持仓"];
    });
  return formatDecimal(溢价率 / 认沽总手数.value, 0);
});

const 认购中位价 = computed(() => {
  let list = [];
  非组合TiledData.value
    .filter((el) => el["沽购"] === "购")
    .forEach((el) => {
      for (let i = 0; i < el["持仓"]; i++) {
        list.push(el["一手价"]);
      }
    });
  return formatDecimal(getMedian(list), 1);
});

const 认沽中位价 = computed(() => {
  let list = [];
  非组合TiledData.value
    .filter((el) => el["沽购"] === "沽")
    .forEach((el) => {
      for (let i = 0; i < el["持仓"]; i++) {
        list.push(el["一手价"]);
      }
    });
  return formatDecimal(getMedian(list), 1);
});

const 沽购价格List = computed(() => {
  return [
    {
      title: "认购总价",
      value: 认购总价.value,
      background: "#ffcccc",
    },
    {
      title: "认沽总价",
      value: 认沽总价.value,
      background: "#e6ebda",
    },
  ];
});
const 沽购代替正股List = computed(() => {
  return [
    {
      title: "认购代替正股总和",
      value: 认购代替正股总和.value,
      background: "#ffcccc",
    },
    {
      title: "认沽代替正股总和",
      value: 认沽代替正股总和.value,
      background: "#e6ebda",
    },
  ];
});

const 沽购持仓价格分布Option = computed(() => {
  const 认沽list = 非组合TiledData.value.filter((el) => el["沽购"] === "沽");
  const 认购list = 非组合TiledData.value.filter((el) => el["沽购"] === "购");
  const 认沽SeriesData = 认沽list.map((el) => [el["一手价"], el["持仓"], el["期权名称"]]);
  const 认购SeriesData = 认购list.map((el) => [el["一手价"], el["持仓"], el["期权名称"]]);
  return {
    title: {
      text: "沽购持仓价格分布",
    },
    grid: {
      bottom: "0",
      top: "30px",
      left: "0",
      right: "0",
    },
    xAxis: {},
    yAxis: {},
    legend: {
      right: "10%",
      top: "3%",
      data: ["认购", "认沽"],
    },
    series: [
      {
        name: "认沽",
        symbolSize: 20,
        data: 认沽SeriesData,
        type: "scatter",
        itemStyle: {
          color: "green",
        },
        emphasis: {
          focus: "series",
          label: {
            show: true,
            formatter: function (param) {
              return `${param.data[2]}\n\n${param.data[1]}手\n${param.data[0]}`;
            },
            // position: "top",
          },
        },
      },
      {
        name: "认购",
        symbolSize: 20,
        data: 认购SeriesData,
        type: "scatter",
        itemStyle: {
          color: "red",
        },
        emphasis: {
          focus: "series",
          label: {
            show: true,
            formatter: function (param) {
              return `${param.data[2]}\n\n${param.data[1]}手\n${param.data[0]}`;
            },
            // position: "top",
          },
        },
      },
    ],
  };
});
</script>
