// Mock monthly leadership review — single source of truth for the report UI.
// Will be replaced by real generateMonthlyLeadershipReview output once the structure is validated.

export const monthlyLeadershipBrief = {
  client_name: "Sarah Mitchell",
  client_title: "Director of Operations",
  client_company: "Northwind Logistics",
  review_period: "June 2026",
  coach_name: "James Laggett",
  generated_date: "2026-07-01",

  // 1. Executive Summary — What changed this month?
  executive_summary: {
    headline: "Ready to Delegate",
    narrative:
      "Sarah's strategic thinking outpaced her willingness to let go of operational work this month. The coaching opportunity is a single delegation decision that would reclaim capacity for the strategic leadership she is already ready for.",
    confidence: "High",
  },

  // 2. Patterns This Month — What behaviors explain those changes?
  leadership_pattern: {
    title: "Strategic Anticipation Before Executive Engagement",
    explanation:
      "Prepares strategically before senior meetings but defaults to tactical execution under operational pressure.",
    classification: "Strength",
  },

  leadership_momentum: {
    indicator: "Improving",
    interpretation:
      "Strategic capacity is strengthening week-over-week while operational delegation has not yet moved.",
  },

  // 3. Thought vs. Action — What evidence supports the observations?
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

  monthly_trend: [
    { week_label: "Week 1", alignment_score: 91, thought_action_gap: 3 },
    { week_label: "Week 2", alignment_score: 93, thought_action_gap: 2 },
    { week_label: "Week 3", alignment_score: 95, thought_action_gap: 2 },
    { week_label: "Week 4", alignment_score: 94, thought_action_gap: 1 },
  ],

  // 4. What's Working — Which leadership behaviors should continue?
  whats_working: [
    "Names the delegation gap unprompted in weekly reflections.",
    "Surfaced Jonathan as ready to absorb tier-1 escalations.",
    "Holds strategic thinking steady under escalation pressure.",
  ],

  // 5. Watch Out For — Which behaviors or patterns deserve coaching attention?
  watch_out_for: [
    "Tier-1 escalations still route directly to Sarah, not her reports.",
    "Delegation conversation with Jonathan deferred two weeks running.",
    "Operational activity crowding out Level 3–4 strategic capacity.",
  ],

  // 6. Recommended Focus — What should the client intentionally practice next month?
  leadership_practices: {
    primary_practice: {
      title: "Delegation as Capacity Reclamation",
      purpose:
        "Redirect tier-1 customer escalations to Jonathan so Sarah's capacity shifts toward strategic-level work.",
      practice:
        "Establish a written escalation protocol with Jonathan by week two, then route all incoming tier-1 issues through him without exception for the remainder of the month.",
      reflection_question:
        "What is one specific decision this week that I chose to delegate rather than handle myself?",
    },
    supporting_practice: {
      title: "Holding the Delegation Line",
      purpose:
        "Sustain the escalation protocol when operational pressure tempts Sarah to step back in.",
      practice:
        "When a tier-1 escalation arrives, wait twenty-four hours before engaging. If Jonathan has not resolved it, coach him through the resolution rather than taking it back.",
      reflection_question:
        "Where did I step in when I could have coached instead?",
    },
    growth_practice: {
      title: "Activating Reclaimed Capacity",
      purpose:
        "Channel the capacity reclaimed through delegation into the strategic-level work she is already prepared for.",
      practice:
        "Each week, dedicate two hours of reclaimed time to a strategic initiative that would not have been possible before delegating tier-1 ownership.",
      reflection_question:
        "What strategic work did I make space for this week that delegation enabled?",
    },
  },
};