import type { AuditResult, UseCase } from '@/types';

const ANTHROPIC_KEY = (import.meta.env.VITE_ANTHROPIC_API_KEY as string) || '';

/**
 * Generate an AI-powered summary of an audit result
 * 
 * See PROMPTS.md for full documentation of this prompt,
 * model selection, and fallback behavior.
 * 
 * Model: Claude 3.5 Haiku (fast, cost-efficient, accurate for structured summaries)
 * Prompt: Defined in PROMPTS.md under "Prompt 1: AI Spend Audit Summary"
 * Fallback: If API is unavailable, returns a templated summary
 * Rate limit: 5-second timeout + best-effort fallback
 */
export async function generateAISummary(report: AuditResult): Promise<string> {
  // Best-effort: call Anthropic if configured, otherwise return a local templated summary
  if (!ANTHROPIC_KEY) {
    return generateTemplatedSummary(report);
  }

  try {
    // Construct the prompt per PROMPTS.md spec
    const prompt = buildAISummaryPrompt(report);

    // Call Anthropic Claude API with 5-second timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    try {
      const resp = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': ANTHROPIC_KEY,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-3-5-haiku-20241022', // Latest Claude 3.5 Haiku
          max_tokens: 400,
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!resp.ok) {
        // API error; fall back to template
        console.warn(`Anthropic API error: ${resp.status}. Using template.`);
        return generateTemplatedSummary(report);
      }

      const json = await resp.json();
      // Extract text from Claude's standard response format
      if (json?.content && Array.isArray(json.content) && json.content.length > 0) {
        return json.content[0].text || generateTemplatedSummary(report);
      }
      return generateTemplatedSummary(report);
    } catch (err) {
      clearTimeout(timeoutId);
      if (err instanceof Error && err.name === 'AbortError') {
        console.warn('Anthropic API timeout. Using template.');
      } else {
        console.warn('Anthropic API error:', err);
      }
      return generateTemplatedSummary(report);
    }
  } catch (e) {
    console.error('Summary generation error:', e);
    return generateTemplatedSummary(report);
  }
}

/**
 * Build the AI summary prompt per PROMPTS.md specification
 * See PROMPTS.md for full prompt template and design rationale
 */
const WORKFLOW_ORDER: UseCase[] = ['coding', 'writing', 'research', 'analytics', 'mixed'];

function deriveWorkflowSummary(tools: Array<{ useCase?: UseCase }>): string {
  const uniqueWorkflows = Array.from(new Set(tools.map((tool) => tool.useCase ?? 'mixed')));
  return uniqueWorkflows
    .sort((a, b) => WORKFLOW_ORDER.indexOf(a) - WORKFLOW_ORDER.indexOf(b))
    .join(', ');
}

function buildAISummaryPrompt(report: AuditResult): string {
  const workflowSummary = deriveWorkflowSummary(report.input.tools);
  const topRecs = report.recommendations.slice(0, 3);
  const recsList = topRecs
    .map((rec) => `- **${rec.title}**: $${rec.estimatedMonthlySavings}/mo ($${rec.estimatedAnnualSavings}/yr)`)
    .join('\n');

  return `You are an AI advisor summarizing a financial audit of AI tool spending for a startup founder.

**Current Situation:**
- Team size: ${report.input.teamSize} people
- Workflow coverage: ${workflowSummary}
- Current monthly AI spend: $${report.metrics.totalMonthlySpend}/month ($${report.metrics.totalAnnualSpend}/year)
- Tools: ${report.input.tools.map((t) => t.tool).join(', ')}

**Audit Results:**
- Estimated monthly savings: $${report.metrics.estimatedMonthlySavings} (${report.metrics.savingsPercentage.toFixed(1)}% of current spend)
- Estimated annual savings: $${report.metrics.estimatedAnnualSavings}
- ${report.recommendations.length} optimization opportunities identified

**Top Recommendations:**
${recsList}

**Task:**
Write a concise, 3-paragraph summary for this founder that:
1. Quickly validates their current spend and team profile
2. Highlights the top 1-2 savings opportunities with exact numbers
3. Recommends next steps (e.g., "Consider a paid audit consultation to evaluate tool switching" or "This spend is healthy; focus on monitoring as you scale")

Tone: Direct, founder-focused, financial. Avoid jargon. Every claim must reference a specific number from the audit.
Length: 200-300 words, exactly 3 paragraphs.
Format: Plain text, no markdown.`;
}

/**
 * Fallback: Generate a templated summary when API is unavailable
 * This ensures the product works even without API integration
 */
function generateTemplatedSummary(report: AuditResult): string {
  const workflowSummary = deriveWorkflowSummary(report.input.tools);
  const topRecs = report.recommendations.slice(0, 3);
  const recsList = topRecs.map((r) => `- ${r.title}: $${r.estimatedMonthlySavings}/mo`).join('\n');

  return `Summary for your AI spend audit:

Your ${report.input.teamSize}-person team is spending $${report.metrics.totalMonthlySpend}/month on AI tools, which works out to $${(report.metrics.totalMonthlySpend / report.input.teamSize).toFixed(0)} per person per month. This is reasonable for a ${workflowSummary}-focused stack.

Our audit identified an estimated $${report.metrics.estimatedMonthlySavings}/month in potential savings (${report.metrics.savingsPercentage.toFixed(1)}% of your current spend), which amounts to $${report.metrics.estimatedAnnualSavings}/year. Here are your top opportunities:
${recsList}

We recommend evaluating these changes immediately before your next billing cycle. Given the scale of potential savings and the implementation effort required, these are high-confidence opportunities to preserve runway. If you'd like help prioritizing these changes or negotiating with vendors, our team can assist.`;
}
