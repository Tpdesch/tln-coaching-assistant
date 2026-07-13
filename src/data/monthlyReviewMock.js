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
      "Strategic thinking is strengthening week-over-week while delegation remains stalled, widening the gap she can already name.",
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
    "Prepares strategic frames before senior meetings.",
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
      title: "Executive Presence Preparation",
      purpose:
        "Deepen the anticipatory preparation habit that already differentiates Sarah's senior-stakeholder engagements.",
      practice:
        "Before each executive meeting, spend fifteen minutes documenting the single strategic message you want to leave behind and one question you want the room to wrestle with.",
      reflection_question:
        "Did I enter the room with a strategic frame, or did I react to the room's frame?",
    },
    growth_practice: {
      title: "Strategic Visibility Through Narrative",
      purpose:
        "Expand long-term leadership capacity by translating operational wins into strategic narratives for senior audiences.",
      practice:
        "Once this month, convert a recent operational outcome into a three-sentence strategic narrative and share it with a peer outside your immediate function.",
      reflection_question:
        "What story am I currently telling about my leadership, and is it the story I want senior leaders to hear?",
    },
  },
};