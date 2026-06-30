<script setup lang="ts">
import { Message } from "@arco-design/web-vue";
import { COUNTRY_CODES, PRODUCT_IDS } from "../domain/constants";
import { buildDecisionMarkdown } from "../domain/prompt";
import { downloadTextFile, state } from "../domain/store";
import { countryName, productName } from "../domain/format";
import { validateState } from "../domain/validation";

const copyMarkdown = async () => {
  await navigator.clipboard.writeText(buildDecisionMarkdown());
  Message.success("已复制 Markdown 决策书");
};

const exportMarkdown = () => {
  downloadTextFile(`taima-q${state.currentQuarter}-decision.md`, buildDecisionMarkdown(), "text/markdown;charset=utf-8");
};
</script>

<template>
  <main class="page">
    <header class="page-header">
      <div>
        <h1 class="page-title">季度决策书</h1>
        <p class="page-subtitle">汇总价格、发货、推广、销售代表、研发、生产地和财务决策。</p>
      </div>
      <div class="actions">
        <a-button @click="copyMarkdown">复制 Markdown</a-button>
        <a-button type="primary" @click="exportMarkdown">导出 Markdown</a-button>
      </div>
    </header>

    <section class="panel">
      <h2 class="panel-title">校验状态</h2>
      <a-alert v-if="validateState().length === 0" type="success" message="当前决策书通过基础校验。" />
      <a-list v-else size="small">
        <a-list-item v-for="issue in validateState()" :key="issue.message">
          <a-tag :color="issue.level === 'error' ? 'red' : 'orange'">{{ issue.level }}</a-tag>
          {{ issue.message }}
        </a-list-item>
      </a-list>
    </section>

    <section class="panel">
      <h2 class="panel-title">核心决策表</h2>
      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>产品</th>
              <th v-for="countryCode in COUNTRY_CODES" :key="`${countryCode}-price`">{{ countryName(countryCode) }}价格</th>
              <th v-for="countryCode in COUNTRY_CODES" :key="`${countryCode}-ship`">{{ countryName(countryCode) }}发货</th>
              <th v-for="countryCode in COUNTRY_CODES" :key="`${countryCode}-promo`">{{ countryName(countryCode) }}推广</th>
              <th>下期生产地</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="productId in PRODUCT_IDS" :key="productId">
              <td>{{ productName(productId) }}</td>
              <td v-for="countryCode in COUNTRY_CODES" :key="`${countryCode}-price`">
                <a-input-number v-model="state.decisionBook.prices[productId][countryCode]" :min="0" :max="99" />
              </td>
              <td v-for="countryCode in COUNTRY_CODES" :key="`${countryCode}-ship`">
                <a-input-number v-model="state.decisionBook.shipments[productId][countryCode]" :min="0" :max="999000" />
              </td>
              <td v-for="countryCode in COUNTRY_CODES" :key="`${countryCode}-promo`">
                <a-input-number v-model="state.decisionBook.promoBudget[productId][countryCode]" :min="0" :max="999000" />
              </td>
              <td>
                <a-select v-model="state.decisionBook.nextProduction[productId]">
                  <a-option v-for="countryCode in COUNTRY_CODES" :key="countryCode" :value="countryCode">{{ countryName(countryCode) }}</a-option>
                </a-select>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section class="grid grid-3">
      <div class="panel">
        <h2 class="panel-title">最高负债限额</h2>
        <a-input-number v-model="state.decisionBook.maxDebt" :min="0" />
      </div>
      <div class="panel">
        <h2 class="panel-title">股票回购金额</h2>
        <a-input-number v-model="state.decisionBook.stockBuyback" :min="0" />
      </div>
      <div class="panel">
        <h2 class="panel-title">本期预测利润</h2>
        <a-input-number v-model="state.decisionBook.forecastProfit" />
      </div>
    </section>

    <section class="panel">
      <h2 class="panel-title">最终决策摘要</h2>
      <a-textarea v-model="state.decisionBook.finalDecision" :auto-size="{ minRows: 8, maxRows: 18 }" />
    </section>
  </main>
</template>
