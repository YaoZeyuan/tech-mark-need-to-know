<script setup lang="ts">
import { computed } from "vue";
import { RouterLink } from "vue-router";
import { ROLE_DEFINITIONS } from "../domain/constants";
import { formatMoney, formatNumber } from "../domain/format";
import { ensureQuarterReport, state } from "../domain/store";
import { roleCompletion, validateState } from "../domain/validation";

const report = computed(() => ensureQuarterReport());
const issues = computed(() => validateState());
const errorCount = computed(() => issues.value.filter((issue) => issue.level === "error").length);
const warningCount = computed(() => issues.value.filter((issue) => issue.level === "warning").length);
const completions = computed(() =>
  ROLE_DEFINITIONS.map((role) => ({
    ...role,
    completion: roleCompletion(role.key),
  })),
);
</script>

<template>
  <main class="page">
    <header class="page-header">
      <div>
        <h1 class="page-title">第 {{ state.currentQuarter }} 季度决策总览</h1>
        <p class="page-subtitle">{{ state.companyGoal }}</p>
      </div>
      <a-space>
        <RouterLink to="/decision-book"><a-button type="primary">查看决策书</a-button></RouterLink>
        <RouterLink to="/prompts"><a-button>生成 Prompt</a-button></RouterLink>
      </a-space>
    </header>

    <section class="grid grid-4">
      <div class="metric">
        <label>税后利润</label>
        <strong>{{ formatMoney(report.financial.incomeStatement["税后利润"]) }}</strong>
      </div>
      <div class="metric">
        <label>现金</label>
        <strong>{{ formatMoney(report.financial.balanceSheet["现金"]) }}</strong>
      </div>
      <div class="metric">
        <label>负债</label>
        <strong>{{ formatMoney(report.financial.balanceSheet["负债"]) }}</strong>
      </div>
      <div class="metric">
        <label>校验问题</label>
        <strong>{{ errorCount }} 错误 / {{ warningCount }} 提醒</strong>
      </div>
    </section>

    <section class="panel">
      <h2 class="panel-title">角色完成度</h2>
      <div class="grid grid-5 role-grid">
        <RouterLink v-for="role in completions" :key="role.key" class="role-tile" :to="role.path">
          <span>{{ role.name }}</span>
          <strong>{{ role.completion.status }}</strong>
          <a-progress :percent="role.completion.percent / 100" size="small" />
        </RouterLink>
      </div>
    </section>

    <section class="grid grid-2">
      <div class="panel">
        <h2 class="panel-title">关键风险</h2>
        <a-alert v-if="issues.length === 0" type="success" message="当前没有校验问题。" />
        <a-list v-else size="small" :bordered="false">
          <a-list-item v-for="issue in issues.slice(0, 8)" :key="`${issue.role}-${issue.message}`">
            <a-tag :color="issue.level === 'error' ? 'red' : 'orange'">{{ issue.level }}</a-tag>
            <span>{{ issue.message }}</span>
          </a-list-item>
        </a-list>
      </div>
      <div class="panel">
        <h2 class="panel-title">决策摘要</h2>
        <a-textarea v-model="state.decisionBook.finalDecision" :auto-size="{ minRows: 8, maxRows: 14 }" placeholder="CEO 最终决策摘要会在这里保存。" />
      </div>
    </section>

    <section class="panel">
      <h2 class="panel-title">市场订单概览</h2>
      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>产品</th>
              <th>市场</th>
              <th>市场销量</th>
              <th>订单量</th>
              <th>销售份额</th>
              <th>预订份额</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in report.market" :key="`${row.productId}-${row.countryCode}`">
              <td>{{ row.productId }}</td>
              <td>{{ row.countryCode }}</td>
              <td>{{ formatNumber(row.marketSales) }}</td>
              <td>{{ formatNumber(row.orders) }}</td>
              <td>{{ row.salesShare }}%</td>
              <td>{{ row.bookingShare }}%</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </main>
</template>

<style scoped>
.grid-5 {
  grid-template-columns: repeat(5, minmax(0, 1fr));
}

.role-tile {
  display: block;
  min-height: 112px;
  padding: 14px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #fbfcff;
  color: inherit;
  text-decoration: none;
}

.role-tile span,
.role-tile strong {
  display: block;
}

.role-tile strong {
  margin: 8px 0 14px;
  color: #111827;
  font-size: 18px;
}

@media (max-width: 1080px) {
  .grid-5 {
    grid-template-columns: 1fr;
  }
}
</style>
