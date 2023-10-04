// ============================================================
// Tone Tag computation — pure rule-based, no LLM needed
// Classifies a session into one of 4 communication patterns
// ============================================================

export type ToneTag = "coaching" | "status_update" | "problem_solving" | "directive";

export interface ToneTagResult {
  tag: ToneTag;
  label: string;
  emoji: string;
  description: string;
  color: string;
  bg: string;
  border: string;
}

interface Metrics {
  managerTalkPct: number;
  reportTalkPct: number;
  managerQuestions: number;
  reportQuestions: number;
  managerInitiatedTopics: number;
  reportInitiatedTopics: number;
  flagged: boolean;
}

const TONE_CONFIG: Record<ToneTag, Omit<ToneTagResult, "tag">> = {
  coaching: {
    label: "Coaching",
    emoji: "🟢",
    description: "Report-led conversation with strong two-way engagement",
    color: "#059669",
    bg: "#ECFDF5",
    border: "#A7F3D0",
  },
  status_update: {
    label: "Status Update",
    emoji: "🔵",
    description: "Manager-driven session focused on updates and direction",
    color: "#2563EB",
    bg: "#EFF6FF",
    border: "#BFDBFE",
  },
  problem_solving: {
    label: "Problem Solving",
    emoji: "🟠",
    description: "High engagement on both sides working through a challenge",
    color: "#D97706",
    bg: "#FFFBEB",
    border: "#FDE68A",
  },
  directive: {
    label: "Directive",
    emoji: "🔴",
    description: "Manager-dominated — consider giving more floor time to your report",
    color: "#DC2626",
    bg: "#FEF2F2",
    border: "#FECACA",
  },
};

export function computeToneTag(metrics: Metrics): ToneTagResult {
  const {
    managerTalkPct,
    managerQuestions,
    reportQuestions,
    managerInitiatedTopics,
    reportInitiatedTopics,
  } = metrics;

  const totalTopics = managerInitiatedTopics + reportInitiatedTopics;
  const reportTopicPct = totalTopics > 0 ? reportInitiatedTopics / totalTopics : 0.5;

  // Directive: manager dominates talk AND topics
  if (managerTalkPct > 65 && reportTopicPct < 0.3) {
    const tag = "directive";
    return { tag, ...TONE_CONFIG[tag] };
  }

  // Coaching: report leads topics AND asks a solid number of questions
  if (reportTopicPct >= 0.45 && reportQuestions >= 3 && managerTalkPct <= 60) {
    const tag = "coaching";
    return { tag, ...TONE_CONFIG[tag] };
  }

  // Problem Solving: both sides highly engaged (many questions from both)
  if (managerQuestions >= 3 && reportQuestions >= 3) {
    const tag = "problem_solving";
    return { tag, ...TONE_CONFIG[tag] };
  }

  // Default: Status Update
  const tag = "status_update";
  return { tag, ...TONE_CONFIG[tag] };
}
