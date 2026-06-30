<script setup lang="ts">
import { Message } from "@arco-design/web-vue";
import { computed, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ROLE_DEFINITIONS } from "../domain/constants";
import { callModel } from "../domain/ai";
import { buildRolePrompt, buildSummaryPrompt } from "../domain/prompt";
import { state } from "../domain/store";
import type { ModelSlotKey, RoleKey } from "../domain/types";

const route = useRoute();
const router = useRouter();
const loading = ref(false);
const advisorSlots: ModelSlotKey[] = ["advisor1", "advisor2", "advisor3"];

const roleFromQuery = (value: unknown): RoleKey | undefined => {
  if (typeof value !== "string") return undefined;
  return ROLE_DEFINITIONS.some((role) => role.key === value) ? (value as RoleKey) : undefined;
};

const selectedRole = ref<RoleKey>(roleFromQuery(route.query.role) ?? "ceo");
const currentRun = computed(() => state.aiRuns[selectedRole.value]);

watch(
  () => route.query.role,
  (value) => {
    const role = roleFromQuery(value);
    if (role && role !== selectedRole.value) {
      selectedRole.value = role;
    }
  },
);

watch(
  [selectedRole, () => route.path, () => route.query.role],
  ([role]) => {
    if (route.path !== "/prompts") return;
    if (route.query.role === role) return;
    void router.replace({ query: { ...route.query, role } });
  },
  { immediate: true },
);

const generateRolePrompt = () => {
  currentRun.value.rolePrompt = buildRolePrompt(selectedRole.value);
  Message.success("已生成角色决策 Prompt");
};

const generateSummaryPrompt = () => {
  currentRun.value.summaryPrompt = buildSummaryPrompt(selectedRole.value);
  Message.success("已生成汇总 Prompt");
};

const copyText = async (content: string) => {
  await navigator.clipboard.writeText(content);
  Message.success("已复制");
};

const runApiWorkflow = async () => {
  loading.value = true;
  try {
    const prompt = currentRun.value.rolePrompt || buildRolePrompt(selectedRole.value);
    currentRun.value.rolePrompt = prompt;
    const advisorResults = await Promise.all(
      advisorSlots.map(async (slot) => {
        const result = await callModel(state.modelGateway, state.modelConfigs[slot], prompt);
        return { slot, content: `${result.cached ? "[缓存命中]\n" : ""}${result.content}` };
      }),
    );
    for (const result of advisorResults) {
      currentRun.value.advisorResponses[result.slot] = result.content;
    }
    currentRun.value.summaryPrompt = buildSummaryPrompt(selectedRole.value);
    const decisionResult = await callModel(state.modelGateway, state.modelConfigs.decision, currentRun.value.summaryPrompt);
    currentRun.value.summaryResponse = `${decisionResult.cached ? "[缓存命中]\n" : ""}${decisionResult.content}`;
    Message.success("AI 并发参谋与决策汇总已完成");
  } catch (error) {
    Message.error(error instanceof Error ? error.message : "AI 调用失败");
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <main class="page">
    <header class="page-header">
      <div>
        <h1 class="page-title">Prompt 工作台</h1>
        <p class="page-subtitle">生成结构化 prompt，支持手动复制和 OpenAI 兼容 API 并发调用。</p>
      </div>
      <div class="actions">
        <a-select v-model="selectedRole" :style="{ width: '180px' }">
          <a-option v-for="role in ROLE_DEFINITIONS" :key="role.key" :value="role.key">{{ role.name }}</a-option>
        </a-select>
        <a-button @click="generateRolePrompt">生成角色 Prompt</a-button>
        <a-button @click="generateSummaryPrompt">生成汇总 Prompt</a-button>
        <a-button type="primary" :loading="loading" @click="runApiWorkflow">API 并发分析</a-button>
      </div>
    </header>

    <section class="panel">
      <h2 class="panel-title">角色决策 Prompt</h2>
      <a-textarea v-model="currentRun.rolePrompt" class="textarea-mono" :auto-size="{ minRows: 12, maxRows: 24 }" />
      <div class="actions prompt-actions">
        <a-button @click="copyText(currentRun.rolePrompt)">复制角色 Prompt</a-button>
        <a-link href="https://chat.deepseek.com/" target="_blank">DeepSeek</a-link>
        <a-link href="https://gemini.google.com/" target="_blank">Gemini</a-link>
        <a-link href="https://chatgpt.com/" target="_blank">ChatGPT</a-link>
      </div>
    </section>

    <section class="grid grid-3">
      <div class="panel">
        <h2 class="panel-title">DeepSeek 回复</h2>
        <a-textarea v-model="currentRun.manualResponses.deepseek" :auto-size="{ minRows: 8, maxRows: 18 }" />
      </div>
      <div class="panel">
        <h2 class="panel-title">Gemini 回复</h2>
        <a-textarea v-model="currentRun.manualResponses.gemini" :auto-size="{ minRows: 8, maxRows: 18 }" />
      </div>
      <div class="panel">
        <h2 class="panel-title">ChatGPT 回复</h2>
        <a-textarea v-model="currentRun.manualResponses.chatgpt" :auto-size="{ minRows: 8, maxRows: 18 }" />
      </div>
    </section>

    <section class="grid grid-3">
      <div v-for="slot in advisorSlots" :key="slot" class="panel">
        <h2 class="panel-title">{{ state.modelConfigs[slot].label }}</h2>
        <a-textarea v-model="currentRun.advisorResponses[slot]" :auto-size="{ minRows: 8, maxRows: 18 }" />
      </div>
    </section>

    <section class="panel">
      <h2 class="panel-title">汇总 Prompt</h2>
      <a-textarea v-model="currentRun.summaryPrompt" class="textarea-mono" :auto-size="{ minRows: 10, maxRows: 20 }" />
      <div class="actions prompt-actions">
        <a-button @click="copyText(currentRun.summaryPrompt)">复制汇总 Prompt</a-button>
      </div>
    </section>

    <section class="panel">
      <h2 class="panel-title">最终汇总结果</h2>
      <a-textarea v-model="currentRun.summaryResponse" :auto-size="{ minRows: 10, maxRows: 24 }" />
    </section>
  </main>
</template>

<style scoped>
.prompt-actions {
  margin-top: 12px;
}
</style>
