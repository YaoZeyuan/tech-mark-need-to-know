import { COUNTRY_CODES, PRODUCT_IDS, ROLE_DEFINITIONS } from "./constants";
import { compactJson, countryName, productName } from "./format";
import { ensureQuarterReport, state } from "./store";
import type { RoleKey } from "./types";
import { validateState } from "./validation";

const roleTitle = (role: RoleKey) => ROLE_DEFINITIONS.find((item) => item.key === role)?.name ?? role;

const costTableSummary = () =>
  state.costTable
    .map((row) => {
      const routes = [
        row.toE === undefined ? "" : `运到尤国 ${row.toE}`,
        row.toL === undefined ? "" : `运到纳国 ${row.toL}`,
        row.toN === undefined ? "" : `运到尼国 ${row.toN}`,
      ]
        .filter(Boolean)
        .join("，");
      return `${countryName(row.origin)}生产 ${productName(row.productId)} ${row.volumeRange}：本地 ${row.localCost}${routes ? `，${routes}` : ""}`;
    })
    .join("\n");

export const buildRolePrompt = (role: RoleKey) => {
  const report = ensureQuarterReport();
  const template = `${state.promptTemplates[role]}\n\n${state.promptTemplates.advisor}`;
  const payload = {
    当前季度: state.currentQuarter,
    公司目标: state.companyGoal,
    当前角色: roleTitle(role),
    国家: state.countries,
    产品: state.products,
    产品参数: state.productParameters,
    市场理想值: state.marketIdealValues,
    决策书: state.decisionBook,
    本季度报告: report,
    校验问题: validateState(),
    成本产量表摘要: costTableSummary(),
  };
  return `${template}\n\n请仅基于以下结构化数据分析，不要假设本机已完成经营测算。\n\n${compactJson(payload)}`;
};

export const buildSummaryPrompt = (role: RoleKey) => {
  const run = state.aiRuns[role];
  return `${state.promptTemplates.modelSummary}\n\n角色：${roleTitle(role)}\n\n参谋模型回复：\n${compactJson(run.advisorResponses)}\n\n请输出可执行的最终建议。`;
};

export const buildDecisionMarkdown = () => {
  const lines: string[] = [
    `# 态马商战第 ${state.currentQuarter} 季度决策`,
    "",
    `## 公司目标`,
    state.companyGoal || "未填写",
    "",
    "## 价格",
  ];
  for (const productId of PRODUCT_IDS) {
    lines.push(`- ${productName(productId)}：${COUNTRY_CODES.map((code) => `${countryName(code)} ${state.decisionBook.prices[productId][code]}`).join("；")}`);
  }
  lines.push("", "## 发货数量");
  for (const productId of PRODUCT_IDS) {
    lines.push(`- ${productName(productId)}：${COUNTRY_CODES.map((code) => `${countryName(code)} ${state.decisionBook.shipments[productId][code]}`).join("；")}`);
  }
  lines.push("", "## 推广预算");
  for (const productId of PRODUCT_IDS) {
    lines.push(`- ${productName(productId)}：${COUNTRY_CODES.map((code) => `${countryName(code)} ${state.decisionBook.promoBudget[productId][code]}`).join("；")}`);
  }
  lines.push("", "## 下期生产地点");
  for (const productId of PRODUCT_IDS) {
    lines.push(`- ${productName(productId)}：${countryName(state.decisionBook.nextProduction[productId])}`);
  }
  lines.push(
    "",
    "## 财务决策",
    `- 最高负债限额：${state.decisionBook.maxDebt}`,
    `- 股票回购金额：${state.decisionBook.stockBuyback}`,
    `- 本期预测利润：${state.decisionBook.forecastProfit}`,
    "",
    "## 最终决策摘要",
    state.decisionBook.finalDecision || "未填写",
  );
  return lines.join("\n");
};
