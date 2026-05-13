/**
 * AI Spend Audit SaaS - Core Domain Types
 * 
 * These types define the financial and product domain.
 * All calculations and recommendations flow through these structures.
 */

// ==================================================
// SUPPORTED TOOLS & PLANS
// ==================================================

export type AITool = 'cursor' | 'github-copilot' | 'claude' | 'chatgpt' | 'openai-api' | 'anthropic-api' | 'gemini' | 'windsurf';

export type PricingPlan =
  | 'free'
  | 'hobby'
  | 'individual'
  | 'pro'
  | 'plus'
  | 'team'
  | 'business'
  | 'max'
  | 'enterprise'
  | 'ultra'
  | 'credits';

export interface PricingTier {
  plan: PricingPlan;
  monthlyPrice: number;
  seatsIncluded: number;
  costPerExtraUser: number;
  description: string;
}

export interface ToolPricing {
  tool: AITool;
  tiers: PricingTier[];
  defaultCurrency: string;
}

// ==================================================
// USER INPUT & AUDIT INPUT
// ==================================================

export type UseCase = 'coding' | 'writing' | 'research' | 'analytics' | 'mixed';

export interface ToolUsageInput {
  tool: AITool;
  plan: PricingPlan;
  seats: number;
  monthlySpend: number;
  apiCreditsSpend?: number;
  useCase: UseCase;
}

export interface AuditInput {
  tools: ToolUsageInput[];
  teamSize: number;
  totalMonthlySpend: number;
}

// ==================================================
// AUDIT CALCULATIONS
// ==================================================

export interface AuditMetrics {
  totalMonthlySpend: number;
  totalAnnualSpend: number;
  estimatedMonthlySavings: number;
  estimatedAnnualSavings: number;
  savingsPercentage: number;
  savingsOpportunitiesCount: number;
}

// ==================================================
// RECOMMENDATION SYSTEM
// ==================================================

export type RecommendationType =
  | 'ENTERPRISE_DOWNGRADE'
  | 'UNUSED_SEATS'
  | 'API_VS_SUBSCRIPTION'
  | 'CHEAPER_ALTERNATIVE'
  | 'TEAM_PLAN_OPTIMIZATION'
  | 'DUPLICATE_TOOL_OVERLAP'
  | 'OVERPROVISIONED_SEATS'
  | 'UNDERUTILIZED_ENTERPRISE_FEATURES';

export type ConfidenceLevel = 'HIGH' | 'MEDIUM' | 'LOW';

export type ImplementationDifficulty = 'EASY' | 'MODERATE' | 'COMPLEX';

export interface Recommendation {
  id: string;
  tool: AITool;
  type: RecommendationType;
  relatedTools?: AITool[];
  title: string;
  problem: string;
  suggestion: string;
  reasoning: string;
  currentSetup: string;
  estimatedMonthlySavings: number;
  estimatedAnnualSavings: number;
  confidence: ConfidenceLevel;
  implementationDifficulty: ImplementationDifficulty;
}

export interface AuditResult {
  id: string;
  metrics: AuditMetrics;
  recommendations: Recommendation[];
  input: AuditInput;
  createdAt: Date;
  publicSlug: string;
  isHighSavings: boolean;
  isLowSpend: boolean;
  isValid: boolean;
  validationErrors?: Record<string, string>;
}

// ==================================================
// LEAD CAPTURE
// ==================================================

export interface LeadData {
  email: string;
  companyName?: string;
  role?: string;
  teamSize?: number;
  auditId: string;
  createdAt: Date;
}

export interface LeadCaptureInput {
  email: string;
  companyName?: string;
  role?: string;
  teamSize?: number;
  auditId: string;
  publicSlug: string;
  highSavings: boolean;
  monthlySavings: number;
  annualSavings: number;
}

export interface PublicAuditReport {
  id: string;
  slug: string;
  metrics: AuditMetrics;
  recommendations: Recommendation[];
  tool: AITool;
  teamSize: number;
  useCase?: UseCase;
  createdAt: Date;
  summary?: string;
}

// ==================================================
// ERROR & VALIDATION
// ==================================================

export interface ValidationError {
  field: string;
  message: string;
}

export interface AuditError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

// ==================================================
// API RESPONSE TYPES
// ==================================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: AuditError;
  timestamp: string;
}

export interface CreateAuditRequest {
  tools: ToolUsageInput[];
  teamSize: number;
  totalMonthlySpend: number;
}

export interface CreateAuditResponse {
  auditResult: AuditResult;
  publicUrl: string;
}
