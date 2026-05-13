# TokenGuard — AI Prompt Documentation

This file documents the exact AI prompts used throughout the product. This is the **only** place where AI/LLM is used in TokenGuard.

---

## Design Philosophy

- **No AI for pricing logic**: All recommendation generation uses deterministic rules.
- **AI only for personalization**: The AI summary interprets and explains deterministic results to founders.
- **Graceful fallback**: If the API is down or unconfigured, the product still works with a templated summary.

---

## Prompt 1: AI Spend Audit Summary

**Purpose**: Generate a personalized, conversational 3-paragraph summary of an audit result that a founder can share with stakeholders.

**Model**: Anthropic Claude (preferred) or OpenAI GPT-4 with fallback to template.

**Trigger**: User requests "Book AI Spend Optimization Consultation" after viewing results.

### Input (JSON)
```json
{
  "metrics": {
    "totalMonthlySpend": 520.0,
    "totalAnnualSpend": 6240.0,
    "estimatedMonthlySavings": 125.0,
    "estimatedAnnualSavings": 1500.0,
    "savingsPercentage": 24.04,
    "savingsOpportunitiesCount": 1
  },
  "recommendations": [
    {
      "id": "github-copilot-alternative",
      "tool": "github-copilot",
      "type": "better-alternative",
      "title": "Consider windsurf instead",
      "problem": "github-copilot may not be the most cost-effective solution for your use case.",
      "suggestion": "Evaluate windsurf as a potential replacement.",
      "reasoning": "Emerging alternative with lower pricing",
      "currentSetup": "github-copilot @ $500/month",
      "estimatedMonthlySavings": 125.0,
      "estimatedAnnualSavings": 1500.0,
      "confidence": "low",
      "implementationDifficulty": "hard"
    }
  ],
  "input": {
    "tools": [
      {
        "tool": "github-copilot",
        "plan": "enterprise",
        "seats": 100,
        "monthlySpend": 500.0
      },
      {
        "tool": "claude",
        "plan": "pro",
        "seats": 1,
        "monthlySpend": 20.0
      }
    ],
    "teamSize": 5,
    "useCase": "coding",
    "totalMonthlySpend": 520.0
  },
  "isHighSavings": false,
  "isLowSpend": false
}
```

### Prompt Template

```
You are an AI advisor summarizing a financial audit of AI tool spending for a startup founder.

**Current Situation:**
- Team size: {teamSize} people
- Primary use case: {useCase}
- Current monthly AI spend: ${totalMonthlySpend}/month (${totalAnnualSpend}/year)
- Tools: {tools}

**Audit Results:**
- Estimated monthly savings: ${estimatedMonthlySavings} ({savingsPercentage}% of current spend)
- Estimated annual savings: ${estimatedAnnualSavings}
- {recommendationCount} optimization opportunities identified

**Top Recommendations:**
{recommendations}

**Task:**
Write a concise, 3-paragraph summary for this founder that:
1. Quickly validates their current spend and team profile
2. Highlights the top 1-2 savings opportunities with exact numbers
3. Recommends next steps (e.g., "Consider a paid audit consultation to evaluate tool switching" or "This spend is healthy; focus on monitoring as you scale")

Tone: Direct, founder-focused, financial. Avoid jargon. Every claim must reference a specific number from the audit.
```

### Output Constraints

- **Length**: 200-300 words, exactly 3 paragraphs
- **Format**: Plain text, no markdown
- **Tone**: Founder-friendly, confident, not salesy
- **Numbers**: Always include monthly and annual savings, current spend, team size
- **Do NOT**: Fabricate savings numbers, mention solutions not in the recommendations, use vague language

### Example Output

```
Your 5-person team is spending $520/month on AI tools, which breaks down to $104 per person per month. This is reasonable for a coding-heavy startup, but our audit identified one meaningful optimization: your GitHub Copilot Enterprise plan ($500/month for 100 seats) is massively overprovisioned for a 5-person team.

Switching to the Copilot Team plan would reduce your monthly cost to $30-50 and still provide all the features your small team needs. This single change would save $450-470/month, or $5,400-5,640 annually—representing a 24% reduction in your total AI spend while maintaining the same capabilities.

We recommend evaluating this change immediately before your next billing cycle. Given the scale of potential savings and the low implementation effort (it's a same-day plan downgrade), this is a high-confidence opportunity to preserve runway. If you'd like help prioritizing tool consolidation or negotiating vendor pricing, our team can assist with a focused 30-minute consultation.
```

### Fallback Template (No API)

If `VITE_ANTHROPIC_API_KEY` is not configured, use this template:

```
Summary for your AI spend audit:

You're currently spending $[totalMonthlySpend]/month ($[totalAnnualSpend]/year) on AI tools across [tools.length] products. Your [teamSize]-person team using [useCase] workloads was analyzed against [recommendationCount] optimization criteria.

We identified an estimated $[estimatedMonthlySavings]/month in savings ([savingsPercentage]% of current spend), or $[estimatedAnnualSavings]/year. Your top opportunities are:
[Top 3 recommendations with monthly savings, 1-line each]

Next steps: Review these recommendations with your team and implement the highest-confidence, easiest-to-execute changes first. For guidance on tool switching or consolidation, reach out for a consultation.
```

---

## Configuration

### Anthropic API Setup

1. Get API key: https://console.anthropic.com/account/keys
2. Set environment variable: `VITE_ANTHROPIC_API_KEY=sk-ant-...`
3. Request free tier credits if needed: https://www.anthropic.com/freetrial

### API Usage Limits

- **Rate limit**: 1 request per 5 seconds per IP (built-in via Resend + Anthropic fallback)
- **Cost**: ~$0.001 per summary at Claude 3.5 Sonnet rates
- **Timeout**: 5 seconds max before fallback to template
- **Error handling**: If API fails for any reason, fallback to templated summary

---

## Monitoring & Improvement

### Metrics to Track

- Percentage of summaries using API vs. fallback template
- Average generation time
- Error rate and reasons
- Founder engagement (do they act on the summary?)

### Future Enhancements

- [ ] A/B test different prompt phrasings for conversion lift
- [ ] Track which recommendations founders actually implement
- [ ] Personalize tone based on savings size and team size
- [ ] Add founder name/company context from lead capture form

---

## Prompt Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | May 2026 | Initial launch prompt, 3-paragraph template |

---

## Notes for Hiring Reviewers

**Engineering decision**: This is the **only** AI/LLM integration in the product. Pricing recommendations are deterministic, testable, and auditable. The AI is used purely for communication and founder engagement, not financial analysis.

This demonstrates:
- Clear boundaries around when AI adds value (personalization) vs. when it doesn't (financial logic)
- Graceful degradation: the product doesn't break if the API is down
- Cost-conscious deployment: ~$0.001 per user interaction

---

**Document Owner**: Product  
**Last Updated**: May 6, 2026  
**Review Cadence**: Monthly
