import type {
  CostTableRow,
  Country,
  CountryCode,
  Product,
  ProductId,
  PromptTemplateKey,
  RoleDefinition,
} from "./types";

export const COUNTRY_CODES: CountryCode[] = ["E", "L", "N"];
export const PRODUCT_IDS: ProductId[] = ["R1", "R2", "R3"];

// 教材固定市场信息：用于页面展示、默认状态和 prompt 注入。
export const COUNTRIES: Country[] = [
  {
    code: "E",
    name: "尤国",
    currency: "尤元",
    description: "公司总部所在地，初始生产地，成熟市场。",
    exchangeRateToE: 1,
    inflationRate: 0,
    receivableDays: 15,
  },
  {
    code: "L",
    name: "纳国",
    currency: "纳镑",
    description: "发展中国家，本地生产偏好明显，应收账款回收较慢。",
    exchangeRateToE: 4,
    inflationRate: 5,
    receivableDays: 60,
  },
  {
    code: "N",
    name: "尼国",
    currency: "尼元",
    description: "消费者偏好设计出众和品牌知名度。",
    exchangeRateToE: 2,
    inflationRate: 1.25,
    receivableDays: 30,
  },
];

// 教材固定产品信息：雷墨磁3默认不安排最终用户广告促销。
export const PRODUCTS: Product[] = [
  {
    id: "R1",
    name: "雷墨磁1",
    description: "面向重型机械和家电，适合恶劣终端环境。",
    promoAllowed: true,
    initialPrice: 40,
  },
  {
    id: "R2",
    name: "雷墨磁2",
    description: "面向高档电子消费品、音响器材和仪器仪表。",
    promoAllowed: true,
    initialPrice: 26,
  },
  {
    id: "R3",
    name: "雷墨磁3",
    description: "低价无品牌通用电子元件，通常不安排广告促销。",
    promoAllowed: false,
    initialPrice: 32,
  },
];

export const ROLE_DEFINITIONS: RoleDefinition[] = [
  { key: "ceo", name: "CEO", title: "首席执行官", path: "/ceo", focus: "整合各角色输入，裁决最终经营方向。" },
  { key: "cmo", name: "CMO", title: "首席营销官", path: "/cmo", focus: "负责价格、市场、促销、销售队伍和竞争态势。" },
  { key: "coo", name: "COO", title: "首席运营官", path: "/coo", focus: "负责生产计划、发货、库存、生产地和物流成本。" },
  { key: "cfo", name: "CFO", title: "首席财务官", path: "/cfo", focus: "负责财务报告、融资、现金、杠杆和股东回报。" },
  { key: "cto", name: "CTO", title: "首席技术官", path: "/cto", focus: "负责产品参数、市场理想值、研发目标和研发预算。" },
];

export const DEFAULT_MARKET_IDEALS = {
  E: {
    R1: { torque: 4.3, resistance: 3.8 },
    R2: { torque: 2.4, resistance: 2.2 },
    R3: { torque: 1.5, resistance: 3.5 },
  },
  L: {
    R1: { torque: 4.2, resistance: 4.3 },
    R2: { torque: 2.6, resistance: 2.5 },
    R3: { torque: 1.0, resistance: 1.5 },
  },
  N: {
    R1: { torque: 3.8, resistance: 2.1 },
    R2: { torque: 3.4, resistance: 2.6 },
    R3: { torque: 4.7, resistance: 1.4 },
  },
};

export const DEFAULT_MARKET_DEMAND = {
  E: { R1: 275000, R2: 225000, R3: 500000 },
  L: { R1: 250000, R2: 50000, R3: 30000 },
  N: { R1: 200000, R2: 165000, R3: 30000 },
};

export const DEFAULT_PROMO_BUDGET = {
  R1: { E: 450000, L: 125000, N: 450000 },
  R2: { E: 50000, L: 25000, N: 50000 },
  R3: { E: 0, L: 0, N: 0 },
};

export const DEFAULT_PROMPT_TEMPLATES: Record<PromptTemplateKey, string> = {
  ceo: "你是态马商战 CEO 决策顾问。请整合各角色数据，输出本季度优先级、关键风险、最终决策建议和需要人工确认的问题。",
  cmo: "你是态马商战 CMO 顾问。请分析价格、需求、市场份额、促销预算、销售代表和竞争态势，给出下一季度营销决策。",
  coo: "你是态马商战 COO 顾问。请分析生产地、发货量、库存、成本阶梯、物流和供应风险，给出运营决策。",
  cfo: "你是态马商战 CFO 顾问。请分析财务报告、现金、负债、ROA、ROE、杠杆、回购和融资空间，给出财务建议。",
  cto: "你是态马商战 CTO 顾问。请分析产品参数、市场理想值、研发预算和产品定位，给出研发优先级。",
  advisor: "请基于完整结构化数据独立提出一份态马商战下一季度决策建议。请给出建议值、理由、风险、假设和备选方案。",
  modelSummary: "请汇总三个参谋模型的回复，提炼一致点、冲突点、推荐决策书字段、角色行动项和主要风险。",
  deepseekSummary: "请作为最终决策模型，基于三份 AI 回复和我们的结构化数据，输出下一步操作指南、原因和需要人工确认的问题。",
};

const makeRow = (
  id: string,
  origin: CountryCode,
  productId: ProductId,
  volumeRange: string,
  localCost: number,
  routes: Partial<Pick<CostTableRow, "toE" | "toL" | "toN">>,
): CostTableRow => ({ id, origin, productId, volumeRange, localCost, ...routes });

// 教材成本-产量表：按尤元折算，首版只展示、维护并注入 prompt，不做本机利润测算。
export const COST_TABLE: CostTableRow[] = [
  makeRow("E-R1-1", "E", "R1", "少于 562,500", 38.4, { toL: 50.69, toN: 45.31 }),
  makeRow("E-R1-2", "E", "R1", "562,500 至 674,999", 35.2, { toL: 46.46, toN: 41.54 }),
  makeRow("E-R1-3", "E", "R1", "675,000 至 824,999", 32, { toL: 42.24, toN: 37.76 }),
  makeRow("E-R1-4", "E", "R1", "825,000 至 937,499", 25.6, { toL: 33.79, toN: 30.21 }),
  makeRow("E-R1-5", "E", "R1", "937,500 或以上", 22.4, { toL: 29.57, toN: 26.43 }),
  makeRow("E-R2-1", "E", "R2", "少于 250,000", 16.8, { toL: 22.18, toN: 19.82 }),
  makeRow("E-R2-2", "E", "R2", "250,000 至 449,999", 15.4, { toL: 20.33, toN: 18.17 }),
  makeRow("E-R2-3", "E", "R2", "450,000 至 549,999", 14, { toL: 18.48, toN: 16.52 }),
  makeRow("E-R2-4", "E", "R2", "550,000 至 624,999", 11.2, { toL: 14.78, toN: 13.22 }),
  makeRow("E-R2-5", "E", "R2", "625,000 或以上", 9.8, { toL: 12.94, toN: 11.56 }),
  makeRow("E-R3-1", "E", "R3", "少于 325,000", 30.6, { toL: 40.39, toN: 36.11 }),
  makeRow("E-R3-2", "E", "R3", "325,000 至 539,999", 28.05, { toL: 37.03, toN: 33.1 }),
  makeRow("E-R3-3", "E", "R3", "540,000 至 659,999", 25.5, { toL: 33.66, toN: 30.09 }),
  makeRow("E-R3-4", "E", "R3", "660,000 至 749,999", 20.4, { toL: 26.93, toN: 24.07 }),
  makeRow("E-R3-5", "E", "R3", "750,000 或以上", 17.85, { toL: 23.56, toN: 21.06 }),
  makeRow("L-R1-1", "L", "R1", "少于 562,500", 23.52, { toE: 28.69, toN: 28.93 }),
  makeRow("L-R1-2", "L", "R1", "562,500 至 674,999", 22.4, { toE: 27.33, toN: 27.55 }),
  makeRow("L-R1-3", "L", "R1", "675,000 至 824,999", 22.4, { toE: 27.33, toN: 27.55 }),
  makeRow("L-R1-4", "L", "R1", "825,000 至 937,499", 22.4, { toE: 27.33, toN: 27.55 }),
  makeRow("L-R1-5", "L", "R1", "937,500 或以上", 21.28, { toE: 25.96, toN: 26.17 }),
  makeRow("L-R2-1", "L", "R2", "少于 250,000", 10.29, { toE: 12.55, toN: 12.66 }),
  makeRow("L-R2-2", "L", "R2", "250,000 至 449,999", 9.8, { toE: 11.96, toN: 12.05 }),
  makeRow("L-R2-3", "L", "R2", "450,000 至 549,999", 9.8, { toE: 11.96, toN: 12.05 }),
  makeRow("L-R2-4", "L", "R2", "550,000 至 624,999", 9.8, { toE: 11.96, toN: 12.05 }),
  makeRow("L-R2-5", "L", "R2", "625,000 或以上", 9.31, { toE: 11.36, toN: 11.45 }),
  makeRow("L-R3-1", "L", "R3", "少于 325,000", 18.74, { toE: 22.87, toN: 23.05 }),
  makeRow("L-R3-2", "L", "R3", "325,000 至 539,999", 17.85, { toE: 21.78, toN: 21.96 }),
  makeRow("L-R3-3", "L", "R3", "540,000 至 659,999", 17.85, { toE: 21.78, toN: 21.96 }),
  makeRow("L-R3-4", "L", "R3", "660,000 至 749,999", 17.85, { toE: 21.78, toN: 21.96 }),
  makeRow("L-R3-5", "L", "R3", "750,000 或以上", 16.96, { toE: 20.69, toN: 20.86 }),
  makeRow("N-R1-1", "N", "R1", "少于 562,500", 46.08, { toE: 48.84, toL: 70.04 }),
  makeRow("N-R1-2", "N", "R1", "562,500 至 674,999", 42.24, { toE: 44.77, toL: 64.2 }),
  makeRow("N-R1-3", "N", "R1", "675,000 至 824,999", 38.4, { toE: 40.7, toL: 58.37 }),
  makeRow("N-R1-4", "N", "R1", "825,000 至 937,499", 26.88, { toE: 28.49, toL: 40.86 }),
  makeRow("N-R1-5", "N", "R1", "937,500 或以上", 19.2, { toE: 20.35, toL: 29.18 }),
  makeRow("N-R2-1", "N", "R2", "少于 250,000", 20.16, { toE: 21.37, toL: 30.64 }),
  makeRow("N-R2-2", "N", "R2", "250,000 至 449,999", 18.48, { toE: 19.59, toL: 28.09 }),
  makeRow("N-R2-3", "N", "R2", "450,000 至 549,999", 16.8, { toE: 17.81, toL: 25.54 }),
  makeRow("N-R2-4", "N", "R2", "550,000 至 624,999", 11.76, { toE: 12.47, toL: 17.88 }),
  makeRow("N-R2-5", "N", "R2", "625,000 或以上", 8.4, { toE: 8.9, toL: 12.77 }),
  makeRow("N-R3-1", "N", "R3", "少于 325,000", 36.72, { toE: 38.92, toL: 55.81 }),
  makeRow("N-R3-2", "N", "R3", "325,000 至 539,999", 33.66, { toE: 35.68, toL: 51.16 }),
  makeRow("N-R3-3", "N", "R3", "540,000 至 659,999", 30.6, { toE: 32.44, toL: 46.51 }),
  makeRow("N-R3-4", "N", "R3", "660,000 至 749,999", 21.42, { toE: 22.71, toL: 32.56 }),
  makeRow("N-R3-5", "N", "R3", "750,000 或以上", 15.3, { toE: 16.22, toL: 23.26 }),
];

export const INCOME_ROWS = [
  "销售收入",
  "直接成本",
  "毛利",
  "管理费用",
  "库存费用",
  "研发费用",
  "销售费用",
  "促销费用",
  "利息费用",
  "折旧",
  "其他",
  "营业利润",
  "利息收入",
  "税前利润",
  "企业所得税",
  "税后利润",
];

export const BALANCE_ROWS = [
  "现金",
  "应收账款",
  "短期投资",
  "存货",
  "设备",
  "累计折旧",
  "负债",
  "股本",
  "资本公积",
  "留存收益",
];
