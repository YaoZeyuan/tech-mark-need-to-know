<script setup lang="ts">
import { Message, Modal } from "@arco-design/web-vue";
import { clearAiCache } from "../domain/ai";
import { ROLE_DEFINITIONS } from "../domain/constants";
import { buildDecisionMarkdown } from "../domain/prompt";
import {
  downloadTextFile,
  exportStateJson,
  importStateJson,
  resetBusinessData,
  resetCostTable,
  resetModelConfigs,
  resetPromptTemplates,
  state,
} from "../domain/store";
import { countryName, productName } from "../domain/format";

const exportJson = () => {
  downloadTextFile(`taima-state-q${state.currentQuarter}.json`, exportStateJson(), "application/json;charset=utf-8");
};

const exportMarkdown = () => {
  downloadTextFile(`taima-decision-q${state.currentQuarter}.md`, buildDecisionMarkdown(), "text/markdown;charset=utf-8");
};

const importJson = async (event: Event) => {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;
  try {
    importStateJson(await file.text());
    Message.success("导入成功，当前状态已覆盖");
  } catch {
    Message.error("导入失败，请检查 JSON 文件");
  } finally {
    input.value = "";
  }
};

const confirmReset = (title: string, action: () => void) => {
  Modal.confirm({
    title,
    content: "该操作会覆盖本地数据，请确认已经导出备份。",
    onOk: () => {
      action();
      Message.success("操作完成");
    },
  });
};

const clearCache = async () => {
  await clearAiCache();
  Message.success("AI 缓存已清空");
};
</script>

<template>
  <main class="page">
    <header class="page-header">
      <div>
        <h1 class="page-title">设置</h1>
        <p class="page-subtitle">维护模型、模板、规则表、基础配置和导入导出。</p>
      </div>
      <div class="actions">
        <a-button @click="exportJson">导出 JSON</a-button>
        <a-button @click="exportMarkdown">导出 Markdown</a-button>
        <label class="import-label">
          导入 JSON
          <input type="file" accept="application/json,.json" @change="importJson" />
        </label>
      </div>
    </header>

    <a-tabs default-active-key="models">
      <a-tab-pane key="models" title="模型配置">
        <section class="panel">
          <h2 class="panel-title">OpenAI 兼容模型槽位</h2>
          <div class="grid grid-2">
            <div v-for="config in state.modelConfigs" :key="config.label" class="model-box">
              <h3>{{ config.label }}</h3>
              <a-form :model="config" layout="vertical">
                <a-form-item label="baseUrl"><a-input v-model="config.baseUrl" placeholder="https://api.example.com" /></a-form-item>
                <a-form-item label="endpoint"><a-input v-model="config.endpoint" placeholder="/v1/chat/completions" /></a-form-item>
                <a-form-item label="model"><a-input v-model="config.model" /></a-form-item>
                <a-form-item label="API_KEY"><a-input-password v-model="config.apiKey" /></a-form-item>
                <a-form-item label="备注"><a-input v-model="config.remark" /></a-form-item>
              </a-form>
            </div>
          </div>
        </section>
      </a-tab-pane>

      <a-tab-pane key="templates" title="Prompt 模板">
        <section class="panel">
          <h2 class="panel-title">模板编辑</h2>
          <a-collapse>
            <a-collapse-item v-for="(_, key) in state.promptTemplates" :key="key" :header="key">
              <a-textarea v-model="state.promptTemplates[key]" :auto-size="{ minRows: 5, maxRows: 16 }" />
            </a-collapse-item>
          </a-collapse>
        </section>
      </a-tab-pane>

      <a-tab-pane key="rules" title="成本规则">
        <section class="panel">
          <h2 class="panel-title">成本-产量表</h2>
          <div class="table-wrap">
            <table class="data-table">
              <thead>
                <tr>
                  <th>生产地</th>
                  <th>产品</th>
                  <th>产量区间</th>
                  <th>本地成本</th>
                  <th>运到尤国</th>
                  <th>运到纳国</th>
                  <th>运到尼国</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in state.costTable" :key="row.id">
                  <td>{{ countryName(row.origin) }}</td>
                  <td>{{ productName(row.productId) }}</td>
                  <td><a-input v-model="row.volumeRange" /></td>
                  <td><a-input-number v-model="row.localCost" :min="0" /></td>
                  <td><a-input-number v-model="row.toE" :min="0" /></td>
                  <td><a-input-number v-model="row.toL" :min="0" /></td>
                  <td><a-input-number v-model="row.toN" :min="0" /></td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </a-tab-pane>

      <a-tab-pane key="base" title="基础配置">
        <section class="grid grid-2">
          <div class="panel">
            <h2 class="panel-title">公司目标</h2>
            <a-textarea v-model="state.companyGoal" :auto-size="{ minRows: 5, maxRows: 12 }" />
          </div>
          <div class="panel">
            <h2 class="panel-title">角色人数</h2>
            <table class="data-table">
              <tbody>
                <tr v-for="role in ROLE_DEFINITIONS" :key="role.key">
                  <th>{{ role.name }} {{ role.title }}</th>
                  <td><a-input-number v-model="state.roleHeadcount[role.key]" :min="0" /></td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </a-tab-pane>

      <a-tab-pane key="reset" title="重置">
        <section class="panel">
          <h2 class="panel-title">本地数据维护</h2>
          <div class="actions">
            <a-button status="warning" @click="confirmReset('重置业务数据', resetBusinessData)">重置业务数据</a-button>
            <a-button status="warning" @click="confirmReset('重置模型配置', resetModelConfigs)">重置模型配置</a-button>
            <a-button status="warning" @click="confirmReset('重置 Prompt 模板', resetPromptTemplates)">重置 Prompt 模板</a-button>
            <a-button status="warning" @click="confirmReset('重置成本规则表', resetCostTable)">重置成本规则表</a-button>
            <a-button status="danger" @click="clearCache">清空 AI 缓存</a-button>
          </div>
        </section>
      </a-tab-pane>
    </a-tabs>
  </main>
</template>

<style scoped>
.model-box {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 16px;
  background: #fbfcff;
}

.model-box h3 {
  margin: 0 0 12px;
  font-size: 16px;
}

.import-label {
  position: relative;
  display: inline-flex;
  align-items: center;
  height: 32px;
  padding: 0 15px;
  border: 1px solid #c9cdd4;
  border-radius: 4px;
  color: #1d2129;
  background: #fff;
  cursor: pointer;
}

.import-label input {
  position: absolute;
  inset: 0;
  opacity: 0;
  cursor: pointer;
}
</style>
