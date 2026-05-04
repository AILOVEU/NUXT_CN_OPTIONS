<template>
  <!-- 核心标签结构，动态绑定样式类 -->
  <span class="my-tag" :class="[`my-tag--${type}`, `my-tag--${effect}`, size && size !== 'default' ? `my-tag--${size}` : '']">
    <!-- 插槽：支持传入任意内容 -->
    <slot></slot>
  </span>
</template>

<script setup>
/**
 * 极简版 Element Plus Tag 组件
 * 仅支持：type / effect / size 三个props + 默认插槽
 */
const props = defineProps({
  // 类型：主题色
  type: {
    type: String,
    default: "info",
    validator: (val) => ["primary", "success", "info", "warning", "danger"].includes(val),
  },
  // 效果：深色/浅色/朴素
  effect: {
    type: String,
    default: "light",
    validator: (val) => ["dark", "light", "plain"].includes(val),
  },
  // 尺寸：大/默认/小
  size: {
    type: String,
    default: "default",
    validator: (val) => ["large", "default", "small"].includes(val),
  },
});
</script>

<style scoped>
/* 基础样式 */
.my-tag {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
  border-radius: 4px;
  white-space: nowrap;
}

/* 尺寸：大号 */
.my-tag--large {
  padding: 8px 12px;
  font-size: 14px;
}
/* 尺寸：默认 */
.my-tag {
  padding: 6px 10px;
  font-size: 14px;
}
/* 尺寸：小号 */
.my-tag--small {
  padding: 4px 8px;
  font-size: 12px;
}

/* 主题色 + 效果组合样式 */
/* primary */
.my-tag--primary.my-tag--light {
  background: #ecf5ff;
  color: #409eff;
  border-color: #d9ecff;
}
.my-tag--primary.my-tag--dark {
  background: #409eff;
  color: #fff;
}
.my-tag--primary.my-tag--plain {
  background: #fff;
  color: #409eff;
  /* border: 1px solid #409eff; */
}

/* success */
.my-tag--success.my-tag--light {
  background: #f0f9ff;
  color: #67c23a;
  border-color: #e1f3d8;
}
.my-tag--success.my-tag--dark {
  background: #67c23a;
  color: #fff;
}
.my-tag--success.my-tag--plain {
  background: #fff;
  color: #67c23a;
  /* border: 1px solid #67c23a; */
}

/* info */
.my-tag--info.my-tag--light {
  background: #f4f4f5;
  color: #909399;
  border-color: #e9e9eb;
}
.my-tag--info.my-tag--dark {
  background: #909399;
  color: #fff;
}
.my-tag--info.my-tag--plain {
  background: #fff;
  color: #909399;
  /* border: 1px solid #909399; */
}

/* warning */
.my-tag--warning.my-tag--light {
  background: #fdf6ec;
  color: #e6a23c;
  border-color: #faecd8;
}
.my-tag--warning.my-tag--dark {
  background: #e6a23c;
  color: #fff;
}
.my-tag--warning.my-tag--plain {
  background: #fff;
  color: #e6a23c;
  /* border: 1px solid #e6a23c; */
}

/* danger */
.my-tag--danger.my-tag--light {
  background: #fef0f0;
  color: #f56c6c;
  border-color: #fde2e2;
}
.my-tag--danger.my-tag--dark {
  background: #f56c6c;
  color: #fff;
}
.my-tag--danger.my-tag--plain {
  background: #fff;
  color: #f56c6c;
  /* border: 1px solid #f56c6c; */
}
</style>
