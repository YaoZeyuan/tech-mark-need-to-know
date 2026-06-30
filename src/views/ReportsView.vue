<script setup lang="ts">
import { computed } from "vue";
import { BALANCE_ROWS, COUNTRY_CODES, INCOME_ROWS, PRODUCT_IDS } from "../domain/constants";
import { countryName, productName } from "../domain/format";
import { ensureQuarterReport, state } from "../domain/store";

const report = computed(() => ensureQuarterReport());
</script>

<template>
  <main class="page">
    <header class="page-header">
      <div>
        <h1 class="page-title">季度报告录入</h1>
        <p class="page-subtitle">录入财务报告、生产库存、市场数据和竞争小组信息，供下一轮 prompt 使用。</p>
      </div>
      <a-input-number v-model="state.currentQuarter" :min="1" />
    </header>

    <a-tabs default-active-key="financial">
      <a-tab-pane key="financial" title="财务报告">
        <section class="grid grid-2">
          <div class="panel">
            <h2 class="panel-title">损益表</h2>
            <div class="table-wrap">
              <table class="data-table">
                <tbody>
                  <tr v-for="row in INCOME_ROWS" :key="row">
                    <th>{{ row }}</th>
                    <td><a-input-number v-model="report.financial.incomeStatement[row]" /></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          <div class="panel">
            <h2 class="panel-title">资产负债表</h2>
            <div class="table-wrap">
              <table class="data-table">
                <tbody>
                  <tr v-for="row in BALANCE_ROWS" :key="row">
                    <th>{{ row }}</th>
                    <td><a-input-number v-model="report.financial.balanceSheet[row]" /></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>
        <section class="panel">
          <h2 class="panel-title">系统管理员通知</h2>
          <a-textarea v-model="report.financial.adminNotice" :auto-size="{ minRows: 4, maxRows: 10 }" />
        </section>
      </a-tab-pane>

      <a-tab-pane key="inventory" title="生产库存">
        <section class="panel">
          <h2 class="panel-title">生产和库存数据</h2>
          <div class="table-wrap">
            <table class="data-table">
              <thead>
                <tr>
                  <th>产品</th>
                  <th>市场</th>
                  <th>期初库存</th>
                  <th>期初成本</th>
                  <th>本期产量</th>
                  <th>当期成本</th>
                  <th>期末库存</th>
                  <th>期末成本</th>
                  <th>毛利率%</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in report.inventory" :key="`${row.productId}-${row.countryCode}`">
                  <td>{{ productName(row.productId) }}</td>
                  <td>{{ countryName(row.countryCode) }}</td>
                  <td><a-input-number v-model="row.openingUnits" :min="0" /></td>
                  <td><a-input-number v-model="row.openingCost" :min="0" /></td>
                  <td><a-input-number v-model="row.producedUnits" :min="0" /></td>
                  <td><a-input-number v-model="row.currentCost" :min="0" /></td>
                  <td><a-input-number v-model="row.closingUnits" :min="0" /></td>
                  <td><a-input-number v-model="row.closingCost" :min="0" /></td>
                  <td><a-input-number v-model="row.grossMargin" /></td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </a-tab-pane>

      <a-tab-pane key="market" title="市场研究">
        <section class="panel">
          <h2 class="panel-title">市场数据</h2>
          <div class="table-wrap">
            <table class="data-table">
              <thead>
                <tr>
                  <th>产品</th>
                  <th>市场</th>
                  <th>市场销量</th>
                  <th>订单量</th>
                  <th>销售份额%</th>
                  <th>预订份额%</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in report.market" :key="`${row.productId}-${row.countryCode}`">
                  <td>{{ productName(row.productId) }}</td>
                  <td>{{ countryName(row.countryCode) }}</td>
                  <td><a-input-number v-model="row.marketSales" :min="0" /></td>
                  <td><a-input-number v-model="row.orders" :min="0" /></td>
                  <td><a-input-number v-model="row.salesShare" :min="0" :max="100" /></td>
                  <td><a-input-number v-model="row.bookingShare" :min="0" :max="100" /></td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section class="panel">
          <h2 class="panel-title">竞争小组数据</h2>
          <div class="table-wrap">
            <table class="data-table">
              <thead>
                <tr>
                  <th>组</th>
                  <th>产品</th>
                  <th>市场</th>
                  <th>份额%</th>
                  <th>价格</th>
                  <th>销售代表</th>
                  <th>利润</th>
                  <th>促销费</th>
                  <th>品牌知名度%</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in report.competitors" :key="`${row.group}-${row.productId}-${row.countryCode}`">
                  <td>{{ row.group }}</td>
                  <td>{{ productName(row.productId) }}</td>
                  <td>{{ countryName(row.countryCode) }}</td>
                  <td><a-input-number v-model="row.marketShare" :min="0" :max="100" /></td>
                  <td><a-input-number v-model="row.price" :min="0" /></td>
                  <td><a-input-number v-model="row.salesReps" :min="0" /></td>
                  <td><a-input-number v-model="row.profit" /></td>
                  <td><a-input-number v-model="row.promoSpend" :min="0" /></td>
                  <td><a-input-number v-model="row.brandAwareness" :min="0" :max="100" /></td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </a-tab-pane>

      <a-tab-pane key="ideal" title="产品参数">
        <section class="grid grid-2">
          <div class="panel">
            <h2 class="panel-title">有效产品参数</h2>
            <table class="data-table">
              <tbody>
                <tr v-for="productId in PRODUCT_IDS" :key="productId">
                  <th>{{ productName(productId) }}</th>
                  <td><a-input-number v-model="report.financial.effectiveParameters[productId].torque" :min="1" :max="5" :step="0.1" /></td>
                  <td><a-input-number v-model="report.financial.effectiveParameters[productId].resistance" :min="1" :max="5" :step="0.1" /></td>
                </tr>
              </tbody>
            </table>
          </div>
          <div class="panel">
            <h2 class="panel-title">市场理想值</h2>
            <table class="data-table">
              <tbody>
                <template v-for="countryCode in COUNTRY_CODES" :key="countryCode">
                  <tr v-for="productId in PRODUCT_IDS" :key="`${countryCode}-${productId}`">
                    <th>{{ countryName(countryCode) }} {{ productName(productId) }}</th>
                    <td><a-input-number v-model="state.marketIdealValues[countryCode][productId].torque" :min="1" :max="5" :step="0.1" /></td>
                    <td><a-input-number v-model="state.marketIdealValues[countryCode][productId].resistance" :min="1" :max="5" :step="0.1" /></td>
                  </tr>
                </template>
              </tbody>
            </table>
          </div>
        </section>
      </a-tab-pane>
    </a-tabs>
  </main>
</template>
