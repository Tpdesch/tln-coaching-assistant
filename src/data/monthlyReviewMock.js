// Mock monthly leadership review — single source of truth for the report UI.
// Will be replaced by real generateMonthlyLeadershipReview output once the structure is validated.

export const monthlyLeadershipBrief = {
  client_name: "Sarah Mitchell",
  client_title: "Director of Operations",
  client_company: "Northwind Logistics",
  leadership_nexus_level: 3,
  review_period: "June 2026",
  coach_name: "James Laggett",
  generated_date: "2026-07-01",

  executive_summary: {
    headline: "Consistent Strategic Alignment with a Delegation Opportunity",
    narrative:
      "Sarah demonstrated consistent leadership alignment throughout June, maintaining an ACI of 94 while navigating a significant customer escalation and preparing for a key executive meeting. Her strategic thinking remained ahead of her visible action, reflecting a leader in transition from tactical execution to strategic delegation. The month's data highlights a clear opportunity to shift customer-level issues to her direct reports, freeing capacity for higher-leverage work.",
    confidence: "High",
  },

  alignment_score: 94,
  alignment_score_delta: 3,
  alignment_trend_direction: "improving",

  thought_action_gap: 2,
  thought_action_gap_label: "Thought Ahead",

  leadership_pattern: {
    title: "Strategic Anticipation Before Executive Engagement",
    explanation:
      "Sarah consistently elevates her strategic thinking in advance of senior-stakeholder meetings, demonstrating strong anticipatory leadership and preparation discipline.",
    classification: "Strength",
  },

  leadership_momentum: {
    indicator: "Improving",
    interpretation:
      "Alignment scores rose from 91 to 94 over the review period, with Thought consistently ahead of Action. Sarah is building strategic capacity faster than she is delegating tactical execution.",
  },

  primary_development_pattern: {
    title: "Delegation as Capacity Reclamation",
    explanation:
      "Customer escalations should flow through Jonathan, not Sarah. Reclaiming this capacity is the highest-leverage move for shifting her profile toward strategic levels.",
  },

  required_leadership_profile: {
    level_1: 30,
    level_2: 25,
    level_3: 25,
    level_4: 15,
    level_5: 5,
  },

  actual_leadership_profile: {
    level_1: 28,
    level_2: 30,
    level_3: 22,
    level_4: 14,
    level_5: 6,
  },

  whats_working:
    "Sarah's strategic thinking continues to strengthen, particularly in her preparation for executive-level engagements. She is self-aware about the delegation gap and has begun naming it explicitly in her reflections.",

  watch_out_for:
    "Time spent in tactical, customer-level issues is pulling Sarah below her target Level 1 threshold. The delegation conversation with Jonathan has been deferred for two consecutive weeks and risks becoming a pattern.",

  primary_focus: "Delegation & Managerial Presence",
  primary_focus_explanation:
    "Sarah identified that customer escalations should be handled by Jonathan, not herself. Reclaiming this capacity is the highest-leverage move for shifting her profile upward toward strategic levels.",

  secondary_focus: "Executive Meeting Readiness",

  growth_recommendation:
    "By next month, Sarah should have a documented delegation agreement with Jonathan for tier-1 customer issues, and should track the hours reclaimed for Level 3-4 work. Target a 5-point reduction in Level 1 time allocation.",

  monthly_trend: [
    { week_label: "Week 1", alignment_score: 91, thought_action_gap: 3 },
    { week_label: "Week 2", alignment_score: 93, thought_action_gap: 2 },
    { week_label: "Week 3", alignment_score: 95, thought_action_gap: 2 },
    { week_label: "Week 4", alignment_score: 94, thought_action_gap: 1 },
  ],
};