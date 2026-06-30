<script setup lang="ts">
import { computed } from "vue";
import { COUNTRY_CODES, PRODUCT_IDS, ROLE_DEFINITIONS } from "../domain/constants";
import { countryName, formatMoney, productName } from "../domain/format";
import { ensureQuarterReport, state } from "../domain/store";
import type { RoleKey } from "../domain/types";
import { roleIssues } from "../domain/validation";

const props = defineProps<{ role: RoleKey }>();

const report = computed(() => ensureQuarterReport());
const roleInfo = computed(() => ROLE_DEFINITIONS.find((role) => role.key === props.role) ?? ROLE_DEFINITIONS[0]);
const issues = computed(() => roleIssues(props.role));

const pointX = (value: number) => 40 + ((Number(value || 0) - 1) / 4) * 320;
const pointY = (value: number) => 360 - ((Number(value || 0) - 1) / 4) * 320;
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
                  <td><a-input-number v-model="state.decisionBook.research[product.id].targetTorque" :min="1" :max="5" :step="0.1" /></td>
                  <td><a-input-number v-model="state.decisionBook.research[product.id].targetResistance" :min="1" :max="5" :step="0.1" /></td>
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
            <g v-for="product in state.products" :key="product.id">
              <circle :cx="pointX(state.productParameters[product.id].torque)" :cy="pointY(state.productParameters[product.id].resistance)" r="6" fill="#2563eb" />
              <text :x="pointX(state.productParameters[product.id].torque) + 8" :y="pointY(state.productParameters[product.id].resistance) + 4" fill="#111827">{{ product.name }}</text>
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
</style>
