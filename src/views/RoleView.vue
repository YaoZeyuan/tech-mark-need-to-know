<script setup lang="ts">
import { Message } from "@arco-design/web-vue";
import { computed } from "vue";
import { RouterLink } from "vue-router";
import { COUNTRY_CODES, PRODUCT_IDS, ROLE_DEFINITIONS } from "../domain/constants";
import { countryName, formatMoney, productName } from "../domain/format";
import { buildRolePrompt } from "../domain/prompt";
import { ensureQuarterReport, state } from "../domain/store";
import type { RoleKey } from "../domain/types";
import { roleIssues } from "../domain/validation";

const props = defineProps<{ role: RoleKey }>();

const report = computed(() => ensureQuarterReport());
const roleInfo = computed(() => ROLE_DEFINITIONS.find((role) => role.key === props.role) ?? ROLE_DEFINITIONS[0]);
const issues = computed(() => roleIssues(props.role));
const currentRun = computed(() => state.aiRuns[props.role]);
const hasAiResponse = computed(
  () =>
    Boolean(currentRun.value.summaryResponse) ||
    Object.values(currentRun.value.manualResponses).some(Boolean) ||
    Object.values(currentRun.value.advisorResponses).some(Boolean),
);
const promptStepCurrent = computed(() => {
  if (hasAiResponse.value) return 4;
  if (currentRun.value.rolePrompt) return 3;
  return issues.value.length ? 1 : 2;
});
const promptWorkbenchTarget = computed(() => ({
  path: "/prompts",
  query: { q: String(state.currentQuarter), role: props.role },
}));

const pointX = (value: number) => 40 + ((Number(value || 0) - 1) / 4) * 320;
const pointY = (value: number) => 360 - ((Number(value || 0) - 1) / 4) * 320;

const generateRolePrompt = () => {
  currentRun.value.rolePrompt = buildRolePrompt(props.role);
  Message.success("已生成本角色 Prompt");
};

const copyRolePrompt = async () => {
  if (!currentRun.value.rolePrompt) {
    generateRolePrompt();
  }
  await navigator.clipboard.writeText(currentRun.value.rolePrompt);
  Message.success("已复制本角色 Prompt");
};
</script>

<template>
  <main class="page">
    <header class="page-header">
      <div>
        <h1 class="page-title">{{ roleInfo.name }} {{ roleInfo.title }}</h1>
        <p class="page-subtitle">{{ roleInfo.focus }}</p>
      </div>
      <a-tag color="arcoblue">第 {{ state.currentQuarter }} 季度</a-tag>
    </header>

    <section v-if="issues.length" class="panel">
      <h2 class="panel-title">校验提示</h2>
      <a-alert
        v-for="issue in issues"
        :key="issue.message"
        :type="issue.level === 'error' ? 'error' : 'warning'"
        :message="issue.message"
        class="issue"
      />
    </section>

    <section class="panel">
      <h2 class="panel-title">角色备注</h2>
      <a-textarea v-model="state.decisionBook.roleNotes[props.role]" :auto-size="{ minRows: 4, maxRows: 10 }" placeholder="记录本角色判断、假设和待 CEO 裁决的问题。" />
    </section>

    <section class="panel ai-helper-panel">
      <a-collapse>
        <a-collapse-item key="ai-helper" header="AI 辅助决策">
          <a-steps :current="promptStepCurrent" size="small" class="role-steps">
            <a-step title="填写输入" description="完善本角色表单" />
            <a-step title="查看校验" description="处理错误和冲突" />
            <a-step title="生成 Prompt" description="生成结构化问题" />
            <a-step title="复制或调用 AI" description="外部粘贴或进入工作台" />
            <a-step title="回填建议" description="保存 AI 回复" />
          </a-steps>
          <div class="actions prompt-actions">
            <a-button type="primary" @click="generateRolePrompt">生成本角色 Prompt</a-button>
            <a-button @click="copyRolePrompt">复制 Prompt</a-button>
            <RouterLink :to="promptWorkbenchTarget" class="prompt-workbench-link">打开 Prompt 工作台</RouterLink>
            <a-link href="https://chat.deepseek.com/" target="_blank">DeepSeek</a-link>
            <a-link href="https://gemini.google.com/" target="_blank">Gemini</a-link>
            <a-link href="https://chatgpt.com/" target="_blank">ChatGPT</a-link>
          </div>
          <a-textarea
            v-model="currentRun.rolePrompt"
            class="textarea-mono"
            :auto-size="{ minRows: 8, maxRows: 18 }"
            placeholder="点击上方按钮生成当前角色 Prompt。"
          />
          <h3 class="subsection-title">AI 回复/建议回填</h3>
          <a-textarea
            v-model="currentRun.manualResponses.deepseek"
            :auto-size="{ minRows: 4, maxRows: 12 }"
            placeholder="可粘贴外部 AI 对本角色的建议，供 CEO 汇总时参考。"
          />
        </a-collapse-item>
      </a-collapse>
    </section>

    <template v-if="props.role === 'ceo'">
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
          <label>最高负债限额</label>
          <strong>{{ formatMoney(state.decisionBook.maxDebt) }}</strong>
        </div>
        <div class="metric">
          <label>预测利润</label>
          <strong>{{ formatMoney(state.decisionBook.forecastProfit) }}</strong>
        </div>
      </section>
      <section class="panel">
        <h2 class="panel-title">最终决策摘要</h2>
        <a-textarea v-model="state.decisionBook.finalDecision" :auto-size="{ minRows: 8, maxRows: 16 }" placeholder="填写最终采用的经营策略、原因和下一步动作。" />
      </section>
    </template>

    <template v-if="props.role === 'cmo'">
      <section class="panel">
        <h2 class="panel-title">价格与推广预算</h2>
        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>产品</th>
                <th v-for="country in state.countries" :key="country.code">{{ country.name }}价格</th>
                <th v-for="country in state.countries" :key="`${country.code}-promo`">{{ country.name }}推广</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="product in state.products" :key="product.id">
                <td>{{ product.name }}</td>
                <td v-for="country in state.countries" :key="country.code">
                  <a-input-number v-model="state.decisionBook.prices[product.id][country.code]" :min="0" :max="99" />
                </td>
                <td v-for="country in state.countries" :key="`${country.code}-promo`">
                  <a-input-number v-model="state.decisionBook.promoBudget[product.id][country.code]" :min="0" :max="999000" :disabled="!product.promoAllowed" />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section class="panel">
        <h2 class="panel-title">销售代表规模与时间分配</h2>
        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>市场</th>
                <th>销售代表</th>
                <th>上限</th>
                <th v-for="productId in PRODUCT_IDS" :key="productId">{{ productName(productId) }}时间</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="country in state.countries" :key="country.code">
                <td>{{ country.name }}</td>
                <td><a-input-number v-model="state.decisionBook.salesReps[country.code]" :min="0" /></td>
                <td><a-input-number v-model="state.decisionBook.salesRepLimits[country.code]" :min="0" /></td>
                <td v-for="productId in PRODUCT_IDS" :key="productId">
                  <a-input-number v-model="state.decisionBook.salesTime[country.code][productId]" :min="0" :max="1" :step="0.1" />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </template>

    <template v-if="props.role === 'coo'">
      <section class="panel">
        <h2 class="panel-title">发货与生产计划</h2>
        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>产品</th>
                <th v-for="country in state.countries" :key="country.code">{{ country.name }}发货</th>
                <th v-for="country in state.countries" :key="`${country.code}-prod`">{{ country.name }}生产</th>
                <th>下期生产地</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="product in state.products" :key="product.id">
                <td>{{ product.name }}</td>
                <td v-for="country in state.countries" :key="country.code">
                  <a-input-number v-model="state.decisionBook.shipments[product.id][country.code]" :min="0" :max="999000" />
                </td>
                <td v-for="country in state.countries" :key="`${country.code}-prod`">
                  <a-input-number v-model="state.decisionBook.production[product.id][country.code]" :min="0" />
                </td>
                <td>
                  <a-select v-model="state.decisionBook.nextProduction[product.id]">
                    <a-option v-for="country in state.countries" :key="country.code" :value="country.code">{{ country.name }}</a-option>
                  </a-select>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section class="panel">
        <h2 class="panel-title">库存数据</h2>
        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>产品</th>
                <th>市场</th>
                <th>期初库存</th>
                <th>本期产量</th>
                <th>期末库存</th>
                <th>毛利率%</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in report.inventory" :key="`${row.productId}-${row.countryCode}`">
                <td>{{ productName(row.productId) }}</td>
                <td>{{ countryName(row.countryCode) }}</td>
                <td><a-input-number v-model="row.openingUnits" :min="0" /></td>
                <td><a-input-number v-model="row.producedUnits" :min="0" /></td>
                <td><a-input-number v-model="row.closingUnits" :min="0" /></td>
                <td><a-input-number v-model="row.grossMargin" /></td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </template>

    <template v-if="props.role === 'cfo'">
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
        <h2 class="panel-title">财务关键项</h2>
        <div class="table-wrap">
          <table class="data-table">
            <tbody>
              <tr v-for="(_, key) in report.financial.balanceSheet" :key="key">
                <th>{{ key }}</th>
                <td><a-input-number v-model="report.financial.balanceSheet[key]" /></td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </template>

    <template v-if="props.role === 'cto'">
      <section class="grid grid-2">
        <div class="panel">
          <h2 class="panel-title">研发项目</h2>
          <div class="table-wrap">
            <table class="data-table">
              <thead>
                <tr>
                  <th>产品</th>
                  <th>目标扭矩</th>
                  <th>目标电阻</th>
                  <th>预算</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="product in state.products" :key="product.id">
                  <td>{{ product.name }}</td>
                  <td><a-input-number v-model="state.decisionBook.research[product.id].targetTorque" :data-testid="`research-torque-${product.id}`" :min="1" :max="5" :step="0.1" /></td>
                  <td><a-input-number v-model="state.decisionBook.research[product.id].targetResistance" :data-testid="`research-resistance-${product.id}`" :min="1" :max="5" :step="0.1" /></td>
                  <td><a-input-number v-model="state.decisionBook.research[product.id].budget" :min="0" /></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <div class="panel">
          <h2 class="panel-title">产品定位图</h2>
          <svg class="scatter" viewBox="0 0 400 400" role="img" aria-label="产品定位图">
            <line x1="40" y1="360" x2="360" y2="360" stroke="#94a3b8" />
            <line x1="40" y1="360" x2="40" y2="40" stroke="#94a3b8" />
            <text x="180" y="392" fill="#64748b">扭矩</text>
            <text x="4" y="210" fill="#64748b" transform="rotate(-90 12 210)">电阻</text>
            <g>
              <circle cx="232" cy="26" r="5" fill="#2563eb" />
              <text x="242" y="31" fill="#475569">当前</text>
              <circle cx="292" cy="26" r="5" fill="#f97316" />
              <text x="302" y="31" fill="#475569">目标</text>
            </g>
            <g v-for="product in state.products" :key="product.id">
              <line
                :x1="pointX(state.productParameters[product.id].torque)"
                :y1="pointY(state.productParameters[product.id].resistance)"
                :x2="pointX(state.decisionBook.research[product.id].targetTorque)"
                :y2="pointY(state.decisionBook.research[product.id].targetResistance)"
                stroke="#f97316"
                stroke-dasharray="4 4"
                stroke-width="1.5"
              />
              <circle :cx="pointX(state.productParameters[product.id].torque)" :cy="pointY(state.productParameters[product.id].resistance)" r="6" fill="#2563eb" />
              <text :x="pointX(state.productParameters[product.id].torque) + 8" :y="pointY(state.productParameters[product.id].resistance) + 4" fill="#111827">{{ product.name }}</text>
              <circle
                :cx="pointX(state.decisionBook.research[product.id].targetTorque)"
                :cy="pointY(state.decisionBook.research[product.id].targetResistance)"
                :data-testid="`target-point-${product.id}`"
                r="5"
                fill="#f97316"
                stroke="#fff"
                stroke-width="2"
              />
              <text
                :x="pointX(state.decisionBook.research[product.id].targetTorque) + 8"
                :y="pointY(state.decisionBook.research[product.id].targetResistance) - 6"
                fill="#9a3412"
              >
                {{ product.name }}目标
              </text>
            </g>
          </svg>
        </div>
      </section>

      <section class="panel">
        <h2 class="panel-title">市场理想值</h2>
        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>市场</th>
                <th>产品</th>
                <th>扭矩理想值</th>
                <th>电阻理想值</th>
              </tr>
            </thead>
            <tbody>
              <template v-for="countryCode in COUNTRY_CODES" :key="countryCode">
                <tr v-for="productId in PRODUCT_IDS" :key="`${countryCode}-${productId}`">
                  <td>{{ countryName(countryCode) }}</td>
                  <td>{{ productName(productId) }}</td>
                  <td><a-input-number v-model="state.marketIdealValues[countryCode][productId].torque" :min="1" :max="5" :step="0.1" /></td>
                  <td><a-input-number v-model="state.marketIdealValues[countryCode][productId].resistance" :min="1" :max="5" :step="0.1" /></td>
                </tr>
              </template>
            </tbody>
          </table>
        </div>
      </section>
    </template>
  </main>
</template>

<style scoped>
.issue + .issue {
  margin-top: 8px;
}

.ai-helper-panel :deep(.arco-collapse) {
  border: 0;
}

.role-steps {
  margin-bottom: 16px;
}

.prompt-actions {
  margin-bottom: 12px;
}

.prompt-workbench-link {
  display: inline-flex;
  align-items: center;
  height: 32px;
  padding: 0 15px;
  border: 1px solid #c9cdd4;
  border-radius: 4px;
  color: #1d2129;
  text-decoration: none;
  background: #fff;
}

.prompt-workbench-link:hover {
  color: #165dff;
  border-color: #165dff;
}

.subsection-title {
  margin: 14px 0 8px;
  color: #111827;
  font-size: 15px;
}
</style>
