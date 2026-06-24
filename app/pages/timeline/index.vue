<template>
  <Nav />
  <div class="max-w-xl mx-auto px-5 py-6">
    <!-- 时间轴列表 -->
    <div v-for="(item, index) in list" :key="index" class="flex mb-8 relative">
      <!-- 左侧节点 + 竖线 -->
      <div class="flex flex-col items-center mr-4">
        <!-- 节点圆点：根据 type 自动变色 -->
        <div class="w-4 h-4 rounded-full flex-shrink-0" :class="[item.type === 'normal' && 'bg-gray-400', item.type === 'important' && 'bg-red-500 shadow-lg shadow-red-300', item.type === 'ignore' && 'bg-gray-200 opacity-50']"></div>

        <!-- 竖线（最后一条不显示） -->
        <div class="w-0.5 bg-gray-200 mt-1 flex-grow" v-if="index !== list.length - 1"></div>
      </div>

      <!-- 右侧内容 -->
      <div class="flex-1">
        <div class="text-base font-semibold text-gray-800">{{ item.title }}</div>
        <div class="text-sm text-gray-600 my-1">{{ item.desc }}</div>
        <div class="text-xs text-gray-400">{{ item.time }}</div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "TimelineTailwind",
  data() {
    return {
      // 你只需要改这里的数据！
      list: [
        {
          type: "ignore",
          title: "10万炒股",
          desc: "超出10万部分,存入招商银行的月月宝(最好按1万整存)",
          time: "2026-05-20",
        },
        {
          type: "ignore",
          title: "2000重塑单笔交易",
          desc: "清理仓位,不做短线双买,call看跌就卖出,call看涨就买入",
          time: "2026-05-20",
        },
        {
          type: "important",
          title: "钱的单位是5000",
          desc: "每月5000资金还房贷，还信用卡。每月目标赚5000",
          time: "2026-05-25",
        },
        {
          type: "important",
          title: "仓位乱就清仓",
          desc: "",
          time: "2026-06-18",
        },
        {
          type: "important",
          title: "期权盈利观点",
          desc: "在便宜的价格买入可能变为实值的合约",
          time: "2026-06-24",
        },
        // {
        //   type: "normal",
        //   title: "任务开始",
        //   desc: "项目初始化，搭建基础结构",
        //   time: "2025-01-01",
        // },
        // {
        //   type: "important",
        //   title: "核心功能开发",
        //   desc: "完成主要业务逻辑开发",
        //   time: "2025-01-10",
        // },
        // {
        //   type: "ignore",
        //   title: "需求调整",
        //   desc: "临时需求变更，暂缓处理",
        //   time: "2025-01-15",
        // },
        // {
        //   type: "normal",
        //   title: "项目上线",
        //   desc: "完成测试，正式发布",
        //   time: "2025-02-01",
        // },
      ],
    };
  },
};
</script>
