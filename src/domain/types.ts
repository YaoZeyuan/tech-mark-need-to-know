export type CountryCode = "E" | "L" | "N";
export type ProductId = "R1" | "R2" | "R3";
export type RoleKey = "ceo" | "cmo" | "coo" | "cfo" | "cto";
export type ModelSlotKey = "advisor1" | "advisor2" | "advisor3" | "decision";
export type PromptTemplateKey =
  | "ceo"
  | "cmo"
  | "coo"
  | "cfo"
  | "cto"
  | "advisor"
  | "modelSummary"
  | "deepseekSummary";

export interface Country {
  code: CountryCode;
  name: string;
  currency: string;
  description: string;
  exchangeRateToE: number;
  inflationRate: number;
  receivableDays: number;
}

export interface Product {
  id: ProductId;
  name: string;
  description: string;
  promoAllowed: boolean;
  initialPrice: number;
}

export interface RoleDefinition {
  key: RoleKey;
  name: string;
  title: string;
  path: string;
  focus: string;
}

export interface ProductParameters {
  torque: number;
  resistance: number;
}

export interface ResearchProject {
  targetTorque: number;
  targetResistance: number;
  budget: number;
  note: string;
}

export interface DecisionBook {
  prices: Record<ProductId, Record<CountryCode, number>>;
  shipments: Record<ProductId, Record<CountryCode, number>>;
  production: Record<ProductId, Record<CountryCode, number>>;
  promoBudget: Record<ProductId, Record<CountryCode, number>>;
  salesReps: Record<CountryCode, number>;
  salesRepLimits: Record<CountryCode, number>;
  salesTime: Record<CountryCode, Record<ProductId, number>>;
  research: Record<ProductId, ResearchProject>;
  nextProduction: Record<ProductId, CountryCode>;
  maxDebt: number;
  stockBuyback: number;
  forecastProfit: number;
  roleNotes: Record<RoleKey, string>;
  finalDecision: string;
}

export interface FinancialReport {
  incomeStatement: Record<string, number>;
  balanceSheet: Record<string, number>;
  adminNotice: string;
  effectiveParameters: Record<ProductId, ProductParameters>;
}

export interface InventoryRecord {
  productId: ProductId;
  countryCode: CountryCode;
  openingUnits: number;
  openingCost: number;
  producedUnits: number;
  currentCost: number;
  closingUnits: number;
  closingCost: number;
  grossMargin: number;
}

export interface MarketRecord {
  productId: ProductId;
  countryCode: CountryCode;
  marketSales: number;
  orders: number;
  salesShare: number;
  bookingShare: number;
}

export interface CompetitorRecord {
  group: number;
  productId: ProductId;
  countryCode: CountryCode;
  marketShare: number;
  price: number;
  salesReps: number;
  profit: number;
  promoSpend: number;
  brandAwareness: number;
  financingActivity: string;
}

export interface QuarterReport {
  financial: FinancialReport;
  inventory: InventoryRecord[];
  market: MarketRecord[];
  competitors: CompetitorRecord[];
  notes: string;
}

export interface CostTableRow {
  id: string;
  origin: CountryCode;
  productId: ProductId;
  volumeRange: string;
  localCost: number;
  toE?: number;
  toL?: number;
  toN?: number;
}

export interface ModelGatewayConfig {
  apiKey: string;
  baseUrl: string;
  endpoint: string;
}

export interface ModelConfig {
  label: string;
  model: string;
  remark: string;
}

export interface AiRunState {
  rolePrompt: string;
  advisorResponses: Record<ModelSlotKey, string>;
  summaryPrompt: string;
  summaryResponse: string;
  manualResponses: Record<string, string>;
}

export interface AppState {
  currentQuarter: number;
  companyGoal: string;
  countries: Country[];
  products: Product[];
  roleHeadcount: Record<RoleKey, number>;
  productParameters: Record<ProductId, ProductParameters>;
  marketIdealValues: Record<CountryCode, Record<ProductId, ProductParameters>>;
  decisionBook: DecisionBook;
  reports: Record<string, QuarterReport>;
  costTable: CostTableRow[];
  promptTemplates: Record<PromptTemplateKey, string>;
  modelGateway: ModelGatewayConfig;
  modelConfigs: Record<ModelSlotKey, ModelConfig>;
  aiRuns: Record<RoleKey, AiRunState>;
}

export interface ValidationIssue {
  role: RoleKey | "global";
  level: "error" | "warning";
  message: string;
}
