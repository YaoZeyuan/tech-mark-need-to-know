import { COUNTRY_CODES, PRODUCT_IDS, PRODUCTS } from "./constants";
import { state } from "./store";
import type { CountryCode, ProductId, RoleKey, ValidationIssue } from "./types";

const inRange = (value: number, min: number, max: number) => Number.isFinite(value) && value >= min && value <= max;

const add = (issues: ValidationIssue[], role: RoleKey | "global", level: ValidationIssue["level"], message: string) => {
  issues.push({ role, level, message });
};

const sumProduct = (matrix: Record<ProductId, Record<CountryCode, number>>, productId: ProductId) =>
  COUNTRY_CODES.reduce((sum, countryCode) => sum + Number(matrix[productId][countryCode] || 0), 0);

export const validateState = (): ValidationIssue[] => {
  const issues: ValidationIssue[] = [];
  for (const product of PRODUCTS) {
    for (const countryCode of COUNTRY_CODES) {
      const price = state.decisionBook.prices[product.id][countryCode];
      const shipment = state.decisionBook.shipments[product.id][countryCode];
      const promo = state.decisionBook.promoBudget[product.id][countryCode];
      if (!Number.isInteger(price) || !inRange(price, 0, 99)) {
        add(issues, "cmo", "error", `${product.name} 在 ${countryCode} 市场价格必须是 0-99 的整数。`);
      }
      if (!Number.isInteger(shipment) || !inRange(shipment, 0, 999000)) {
        add(issues, "coo", "error", `${product.name} 在 ${countryCode} 市场发货量必须是 0-999,000 的整数。`);
      }
      if (!product.promoAllowed && promo > 0) {
        add(issues, "cmo", "error", `${product.name} 不允许填写最终用户推广预算。`);
      }
      if (!Number.isInteger(promo) || !inRange(promo, 0, 999000)) {
        add(issues, "cmo", "error", `${product.name} 在 ${countryCode} 市场推广预算必须是 0-999,000 的整数。`);
      }
    }
    if (sumProduct(state.decisionBook.shipments, product.id) > 2997000) {
      add(issues, "coo", "error", `${product.name} 本季度总发货量超过 2,997,000 上限。`);
    }
    const research = state.decisionBook.research[product.id];
    if (!inRange(research.targetTorque, 1, 5) || !inRange(research.targetResistance, 1, 5)) {
      add(issues, "cto", "error", `${product.name} 研发目标参数必须在 1.0-5.0 之间。`);
    }
  }

  for (const countryCode of COUNTRY_CODES) {
    const reps = state.decisionBook.salesReps[countryCode];
    const limit = state.decisionBook.salesRepLimits[countryCode];
    const timeTotal = PRODUCT_IDS.reduce((sum, productId) => sum + Number(state.decisionBook.salesTime[countryCode][productId] || 0), 0);
    if (!Number.isInteger(reps) || reps < 0) {
      add(issues, "cmo", "error", `${countryCode} 市场销售代表人数必须为非负整数。`);
    }
    if (reps > limit) {
      add(issues, "cmo", "warning", `${countryCode} 市场销售代表人数超过当前上限。`);
    }
    if (Math.abs(timeTotal - 1) > 0.001) {
      add(issues, "cmo", "error", `${countryCode} 市场销售代表时间分配合计必须等于 1.0。`);
    }
  }

  if (state.costTable.length === 0) {
    add(issues, "global", "error", "成本-产量表为空，无法为 AI 提供关键规则。");
  }
  if (!state.companyGoal.trim()) {
    add(issues, "ceo", "warning", "公司目标为空，建议补充本季度经营目标。");
  }
  return issues;
};

export const roleIssues = (role: RoleKey) => validateState().filter((issue) => issue.role === role || issue.role === "global");

export const roleCompletion = (role: RoleKey) => {
  const issues = roleIssues(role);
  const hasError = issues.some((issue) => issue.level === "error");
  const note = state.decisionBook.roleNotes[role]?.trim();
  return {
    status: hasError ? "需修正" : note ? "已填写" : "待补充",
    percent: hasError ? 58 : note ? 100 : 78,
  };
};
