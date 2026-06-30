<script setup lang="ts">
import { computed } from "vue";
import { RouterLink, RouterView, useRoute } from "vue-router";
import { ROLE_DEFINITIONS } from "./domain/constants";

const route = useRoute();
const navItems = computed(() => [
  { path: "/", label: "总览" },
  ...ROLE_DEFINITIONS.map((role) => ({ path: role.path, label: role.name })),
  { path: "/decision-book", label: "决策书" },
  { path: "/reports", label: "报告" },
  { path: "/prompts", label: "Prompt" },
  { path: "/settings", label: "设置" },
]);
</script>

<template>
  <a-layout class="app-shell">
    <a-layout-sider class="app-sidebar" :width="232" breakpoint="lg" collapsible>
      <div class="brand">
        <div class="brand-mark">TM</div>
        <div>
          <strong>态马商战</strong>
          <span>决策工作台</span>
        </div>
      </div>
      <nav class="side-nav">
        <RouterLink
          v-for="item in navItems"
          :key="item.path"
          :class="{ active: route.path === item.path }"
          :to="item.path"
        >
          {{ item.label }}
        </RouterLink>
      </nav>
    </a-layout-sider>
    <a-layout>
      <a-layout-header class="topbar">
        <div>
          <strong>结构化录入、报表校验、AI 辅助决策</strong>
          <span>首版不做本机经营模拟</span>
        </div>
      </a-layout-header>
      <a-layout-content class="content">
        <RouterView />
      </a-layout-content>
    </a-layout>
  </a-layout>
</template>
