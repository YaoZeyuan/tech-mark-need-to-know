import {
  BALANCE_ROWS,
  COST_TABLE,
  COUNTRIES,
  DEFAULT_MARKET_DEMAND,
  DEFAULT_MARKET_IDEALS,
  DEFAULT_PROMO_BUDGET,
  DEFAULT_PROMPT_TEMPLATES,
  INCOME_ROWS,
  PRODUCT_IDS,
  PRODUCTS,
  ROLE_DEFINITIONS,
} from "./constants";
import type {
  AiRunState,
  AppState,
  CountryCode,
  DecisionBook,
  FinancialReport,
  ModelConfig,
  ModelSlotKey,
  ProductId,
  ProductParameters,
  QuarterReport,
  RoleKey,
} from "./types";

const zeroByCountry = () => ({ E: 0, L: 0, N: 0 });
const productMatrix = (valueFactory: (productId: ProductId) => Record<CountryCode, number>) =>
  PRODUCT_IDS.reduce(
    (matrix, productId) => ({ ...matrix, [productId]: valueFactory(productId) }),
    {} as Record<ProductId, Record<CountryCode, number>>,
  );

const createFinancialReport = (): FinancialReport => ({
  incomeStatement: Object.fromEntries(INCOME_ROWS.map((name) => [name, 0])),
  balanceSheet: Object.fromEntries(BALANCE_ROWS.map((name) => [name, 0])),
  adminNotice: "",
  effectiveParameters: createProductParameters(),
});

const createProductParameters = (): Record<ProductId, ProductParameters> => ({
  R1: { torque: 3, resistance: 3 },
  R2: { torque: 3, resistance: 3 },
  R3: { torque: 3, resistance: 3 },
});

const createDecisionBook = (): DecisionBook => ({
  prices: productMatrix((productId) => {
    const product = PRODUCTS.find((item) => item.id === productId);
    return { E: product?.initialPrice ?? 0, L: product?.initialPrice ?? 0, N: product?.initialPrice ?? 0 };
  }),
  shipments: productMatrix(() => zeroByCountry()),
  production: productMatrix(() => zeroByCountry()),
  promoBudget: JSON.parse(JSON.stringify(DEFAULT_PROMO_BUDGET)) as DecisionBook["promoBudget"],
  salesReps: { E: 12, L: 7, N: 10 },
  salesRepLimits: { E: 12, L: 7, N: 10 },
  salesTime: {
    E: { R1: 0.7, R2: 0.2, R3: 0.1 },
    L: { R1: 0.7, R2: 0.2, R3: 0.1 },
    N: { R1: 0.7, R2: 0.2, R3: 0.1 },
  },
  research: {
    R1: { targetTorque: 3, targetResistance: 3, budget: 0, note: "" },
    R2: { targetTorque: 3, targetResistance: 3, budget: 0, note: "" },
    R3: { targetTorque: 3, targetResistance: 3, budget: 0, note: "" },
  },
  nextProduction: { R1: "E", R2: "E", R3: "E" },
  maxDebt: 20000000,
  stockBuyback: 0,
  forecastProfit: 0,
  roleNotes: { ceo: "", cmo: "", coo: "", cfo: "", cto: "" },
  finalDecision: "",
});

const createQuarterReport = (): QuarterReport => ({
  financial: createFinancialReport(),
  inventory: PRODUCT_IDS.flatMap((productId) =>
    COUNTRIES.map((country) => ({
      productId,
      countryCode: country.code,
      openingUnits: 0,
      openingCost: 0,
      producedUnits: 0,
      currentCost: 0,
      closingUnits: 0,
      closingCost: 0,
      grossMargin: 0,
    })),
  ),
  market: PRODUCT_IDS.flatMap((productId) =>
    COUNTRIES.map((country) => ({
      productId,
      countryCode: country.code,
      marketSales: DEFAULT_MARKET_DEMAND[country.code][productId],
      orders: 0,
      salesShare: 0,
      bookingShare: 0,
    })),
  ),
  competitors: [1, 2, 3, 4, 5].flatMap((group) =>
    PRODUCT_IDS.flatMap((productId) =>
      COUNTRIES.map((country) => ({
        group,
        productId,
        countryCode: country.code,
        marketShare: 0,
        price: 0,
        salesReps: 0,
        profit: 0,
        promoSpend: 0,
        brandAwareness: 0,
        financingActivity: "",
      })),
    ),
  ),
  notes: "",
});

const createModelConfig = (label: string): ModelConfig => ({
  label,
  apiKey: "",
  baseUrl: "",
  endpoint: "/v1/chat/completions",
  model: "",
  remark: "",
});

const createAiRunState = (): AiRunState => ({
  rolePrompt: "",
  advisorResponses: { advisor1: "", advisor2: "", advisor3: "", decision: "" },
  summaryPrompt: "",
  summaryResponse: "",
  manualResponses: { deepseek: "", gemini: "", chatgpt: "" },
});

export const createDefaultState = (): AppState => ({
  currentQuarter: 1,
  companyGoal: "在 5-6 个财务季度内扭转局面，提高盈利质量和决策稳定性。",
  countries: JSON.parse(JSON.stringify(COUNTRIES)) as AppState["countries"],
  products: JSON.parse(JSON.stringify(PRODUCTS)) as AppState["products"],
  roleHeadcount: { ceo: 1, cmo: 1, coo: 1, cfo: 1, cto: 1 },
  productParameters: createProductParameters(),
  marketIdealValues: JSON.parse(JSON.stringify(DEFAULT_MARKET_IDEALS)) as AppState["marketIdealValues"],
  decisionBook: createDecisionBook(),
  reports: { "1": createQuarterReport() },
  costTable: JSON.parse(JSON.stringify(COST_TABLE)) as AppState["costTable"],
  promptTemplates: { ...DEFAULT_PROMPT_TEMPLATES },
  modelConfigs: {
    advisor1: createModelConfig("参谋模型1"),
    advisor2: createModelConfig("参谋模型2"),
    advisor3: createModelConfig("参谋模型3"),
    decision: createModelConfig("决策模型"),
  } satisfies Record<ModelSlotKey, ModelConfig>,
  aiRuns: ROLE_DEFINITIONS.reduce(
    (runs, role) => ({ ...runs, [role.key]: createAiRunState() }),
    {} as Record<RoleKey, AiRunState>,
  ),
});

export const createEmptyQuarterReport = createQuarterReport;
