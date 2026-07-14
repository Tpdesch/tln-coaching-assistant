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
      "Strategic thinking is outpacing her willingness to delegate. One decision — routing tier-1 escalations to Jonathan — would reclaim the capacity she needs for strategic leadership. She has already named the gap unprompted and identified Jonathan as ready, but the delegation conversation has been deferred two weeks running, leaving operational work to crowd out the strategic capacity she is actively building.",
    confidence: "High",
  },

  // 2. Patterns This Month — What behaviors explain those changes?
  leadership_pattern: {
    title: "Strategic Anticipation Before Executive Engagement",
    explanation:
      "Rises to strategic before senior meetings; falls back to tactical under pressure.",
    classification: "Strength",
  },

  leadership_momentum: {
    indicator: "Improving",
    interpretation:
      "Strategic capacity is strengthening; delegation has not moved.",
  },

  // 3. Thought vs. Action — 4-week average per level
  thought_averages: {
    level_1: 22,
    level_2: 23,
    level_3: 28,
    level_4: 17,
    level_5: 10,
  },

  action_averages: {
    level_1: 28,
    level_2: 30,
    level_3: 22,
    level_4: 14,
    level_5: 6,
  },

  // 4. What's Working — Which leadership behaviors should continue?
  whats_working: [
    "Names the delegation gap unprompted in weekly reflections.",
    "Surfaced Jonathan as ready to absorb tier-1 escalations.",
    "Holds strategic thinking under pressure.",
  ],

  // 5. Watch Out For — Which behaviors or patterns deserve coaching attention?
  watch_out_for: [
    "Tier-1 escalations still route directly to Sarah, not her reports.",
    "Delegation conversation with Jonathan deferred two weeks running.",
    "Operational work crowding out strategic capacity.",
  ],

  // 6. Recommended Focus — What should the client intentionally practice next month?
  leadership_practices: {
    primary_practice: {
      title: "Delegation as Capacity Reclamation",
      purpose:
        "Route tier-1 escalations through Jonathan to free Sarah for strategic work.",
      practice:
        "Agree a written escalation protocol with Jonathan by week two. Route all tier-1 issues through him — no exceptions.",
      reflection_question:
        "What did I delegate this week that I would have handled myself?",
    },
    supporting_practice: {
      title: "Holding the Delegation Line",
      purpose:
        "Sustain the protocol when pressure tempts her to step back in.",
      practice:
        "When a tier-1 escalation arrives, wait twenty-four hours before engaging. If unresolved, coach Jonathan through it rather than taking it back.",
      reflection_question:
        "Where did I step in when I could have coached instead?",
    },
    growth_practice: {
      title: "Activating Reclaimed Capacity",
      purpose:
        "Channel reclaimed capacity into strategic work.",
      practice:
        "Each week, dedicate two reclaimed hours to strategic work that delegation made possible.",
      reflection_question:
        "What strategic work did I make space for this week?",
    },
  },
};