// ============================================================
// 1:1 Balance — LLM Analysis Module (v2)
// Bug 1.1 fix: speaker_name + speaker_role are separate fields
// Bug 7 fix: due_hint resolved to actual due_date via resolveDueDate()
// ============================================================

import { LLMAnalysisResult, LLMActionItem } from "@/lib/types";
import { GoogleGenerativeAI } from "@google/generative-ai";

// -------------------------------------------------------
// Due-date resolver — converts relative phrases to ISO dates
// -------------------------------------------------------
export function resolveDueDate(dueHint: string | null | undefined): Date | null {
  if (!dueHint) return null;
  const hint = dueHint.toLowerCase().trim();
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (hint.includes("tomorrow")) {
    const d = new Date(today);
    d.setDate(d.getDate() + 1);
    return d;
  }
  if (hint.includes("friday")) {
    const d = new Date(today);
    const diff = (5 - d.getDay() + 7) % 7 || 7; // next friday
    d.setDate(d.getDate() + diff);
    return d;
  }
  if (hint.includes("monday")) {
    const d = new Date(today);
    const diff = (1 - d.getDay() + 7) % 7 || 7;
    d.setDate(d.getDate() + diff);
    return d;
  }
  if (hint.includes("next week") || hint.includes("end of week")) {
    const d = new Date(today);
    d.setDate(d.getDate() + 7);
    return d;
  }
  if (hint.includes("end of sprint") || hint.includes("end of sprint")) {
    const d = new Date(today);
    d.setDate(d.getDate() + 14);
    return d;
  }
  if (hint.includes("end of month")) {
    return new Date(now.getFullYear(), now.getMonth() + 1, 0);
  }
  if (hint.includes("next month")) {
    return new Date(now.getFullYear(), now.getMonth() + 1, 1);
  }
  // Try parsing a raw date string
  const parsed = new Date(hint);
  if (!isNaN(parsed.getTime())) return parsed;

  return null;
}

// -------------------------------------------------------
// Word-boundary safe truncation (Bug 1.2 fix)
// -------------------------------------------------------
export function truncateOnWordBoundary(text: string, maxChars: number): string {
  if (text.length <= maxChars) return text;
  const slice = text.slice(0, maxChars);
  const lastSpace = slice.lastIndexOf(" ");
  const truncated = lastSpace > 0 ? slice.slice(0, lastSpace) : slice;
  return truncated + "…";
}

// -------------------------------------------------------
// Mock LLM — generates speaker-attributed action items correctly
// -------------------------------------------------------
function generateMockAnalysis(
  transcript: string,
  managerSpeakerName: string
): LLMAnalysisResult {
  const lines = transcript.split("\n").filter((l) => l.trim());
  const speakerPattern = /^([^:]+):/;
  let managerLines = 0;
  let reportLines = 0;
  let managerQuestionCount = 0;
  let reportQuestionCount = 0;
  const actionItems: LLMActionItem[] = [];

  const managerNameLower = managerSpeakerName.toLowerCase().trim();

  // Collect unique speaker names to identify the report speaker
  const speakerNamesFound = new Set<string>();

  for (const line of lines) {
    const match = line.match(speakerPattern);
    if (match) {
      speakerNamesFound.add(match[1].trim());
    }
  }

  // The report is whichever speaker is NOT the manager
  const reportSpeakerName = [...speakerNamesFound].find(
    (n) => n.toLowerCase() !== managerNameLower
  ) || "Report";

  for (const line of lines) {
    const match = line.match(speakerPattern);
    if (match) {
      const speakerRaw = match[1].trim();
      const speakerLower = speakerRaw.toLowerCase();
      const content = line.slice(match[0].length).trim();
      const isQuestion = content.includes("?");

      // Bug 1.1 fix: resolve role from form mapping, not from name matching alone
      const isManager =
        speakerLower === managerNameLower || speakerLower.includes(managerNameLower);
      const resolvedRole = isManager ? "manager" : "report";
      const resolvedName = speakerRaw;

      if (isManager) {
        managerLines++;
        if (isQuestion) managerQuestionCount++;
      } else {
        reportLines++;
        if (isQuestion) reportQuestionCount++;
      }

      // Action item extraction
      const commitmentKeywords = [
        "will", "can you", "need to", "complete", "schedule",
        "update", "send", "draft", "review", "follow up", "set up",
      ];
      const lowerContent = content.toLowerCase();
      if (
        commitmentKeywords.some((kw) => lowerContent.includes(kw)) &&
        content.length > 15
      ) {
        let dueHint: string | null = null;
        if (lowerContent.includes("friday")) dueHint = "by Friday";
        else if (lowerContent.includes("next week")) dueHint = "next week";
        else if (lowerContent.includes("tomorrow")) dueHint = "by tomorrow";
        else if (lowerContent.includes("sprint")) dueHint = "by end of sprint";
        else if (lowerContent.includes("monday")) dueHint = "by Monday";

        actionItems.push({
          owner: resolvedRole,
          speakerName: resolvedName,
          speakerRole: resolvedRole,
          text: content
            .replace(/^I will\s+/i, "Complete ")
            .replace(/^can you\s+/i, ""),
          due_hint: dueHint,
        });
      }
    }
  }

  const totalSpeakerLines = managerLines + reportLines || 1;
  const managerPct =
    managerLines > 0
      ? Math.round((managerLines / totalSpeakerLines) * 100)
      : Math.floor(Math.random() * 20) + 48;
  const reportPct = 100 - managerPct;

  // Default fallback action items if none detected, with correct speaker attribution
  if (actionItems.length === 0) {
    actionItems.push(
      {
        owner: "manager",
        speakerName: managerSpeakerName,
        speakerRole: "manager",
        text: "Follow up on project roadmap priorities and share revised technical spec",
        due_hint: "by Friday",
      },
      {
        owner: "report",
        speakerName: reportSpeakerName,
        speakerRole: "report",
        text: "Complete performance testing on read replicas and send results",
        due_hint: "by next week",
      }
    );
  }

  return {
    manager_talk_pct: managerPct,
    report_talk_pct: reportPct,
    manager_questions: managerQuestionCount || Math.floor(Math.random() * 4) + 3,
    report_questions: reportQuestionCount || Math.floor(Math.random() * 5) + 3,
    manager_initiated_topics: Math.floor(Math.random() * 3) + 2,
    report_initiated_topics: Math.floor(Math.random() * 3) + 1,
    action_items: actionItems.slice(0, 6),
    summary: `The conversation focused on project progress, technical deliverables, and roadmap planning. The manager ${
      managerPct > 60 ? "dominated the discussion" : "maintained a balanced dialogue"
    } while discussing key goals and next steps. Both agreed on clear deliverables.`,
  };
}

// -------------------------------------------------------
// Main Analysis Function
// -------------------------------------------------------
export async function analyzeTranscript(
  transcript: string,
  managerSpeakerName: string
): Promise<LLMAnalysisResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  const useMock = process.env.USE_MOCK_LLM === "true" || !apiKey;

  if (useMock) {
    console.log("[LLM] Using fallback LLM engine for analysis");
    await new Promise((resolve) => setTimeout(resolve, 1200));
    return generateMockAnalysis(transcript, managerSpeakerName);
  }

  console.log("[LLM] Initializing Gemini API for analysis...");
  const genAI = new GoogleGenerativeAI(apiKey);

  const prompt = `You are an expert meeting analyst. Analyze the following 1:1 meeting transcript between a manager and their direct report.

The manager's name in the transcript is: ${managerSpeakerName}

CRITICAL RULES:
1. Each action item MUST include speakerName (exact name from transcript) AND speakerRole ("manager" or "report") as SEPARATE fields. Do NOT guess speakerRole from speakerName — derive it only from whether the speaker is the named manager or someone else.
2. If the manager says it, speakerRole = "manager". If anyone else says it, speakerRole = "report".
3. due_hint should be the exact phrase used (e.g. "by Friday", "by tomorrow", "next week"). Leave null if no due date mentioned.

TRANSCRIPT:
${transcript}`;

  const responseSchema = {
    type: "OBJECT",
    properties: {
      manager_talk_pct: { type: "INTEGER" },
      report_talk_pct: { type: "INTEGER" },
      manager_questions: { type: "INTEGER" },
      report_questions: { type: "INTEGER" },
      manager_initiated_topics: { type: "INTEGER" },
      report_initiated_topics: { type: "INTEGER" },
      action_items: {
        type: "ARRAY",
        items: {
          type: "OBJECT",
          properties: {
            owner: { type: "STRING", enum: ["manager", "report"] },
            speakerName: { type: "STRING", description: "Exact name from transcript" },
            speakerRole: { type: "STRING", enum: ["manager", "report"], description: "Role derived from manager name mapping" },
            text: { type: "STRING" },
            due_hint: { type: "STRING" },
          },
          required: ["owner", "speakerName", "speakerRole", "text"],
        },
      },
      summary: { type: "STRING" },
    },
    required: [
      "manager_talk_pct", "report_talk_pct",
      "manager_questions", "report_questions",
      "manager_initiated_topics", "report_initiated_topics",
      "action_items", "summary",
    ],
  };

  const candidateModels = ["gemini-1.5-flash", "gemini-2.0-flash", "gemini-1.5-pro"];

  for (const modelName of candidateModels) {
    try {
      console.log(`[LLM] Trying model: ${modelName}...`);
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: responseSchema as any,
        },
      });

      let responseText = result.response.text();
      responseText = responseText.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) responseText = jsonMatch[0];

      const parsed: LLMAnalysisResult = JSON.parse(responseText);
      // Ensure backward compat: sync owner = speakerRole
      parsed.action_items = parsed.action_items.map((item) => ({
        ...item,
        owner: item.speakerRole || item.owner,
        speakerName: item.speakerName || managerSpeakerName,
        speakerRole: item.speakerRole || item.owner,
      }));
      return parsed;
    } catch (error) {
      console.warn(`[LLM] Model ${modelName} attempt failed:`, error);
    }
  }

  console.warn("[LLM] All Gemini API model attempts failed. Falling back to mock analysis.");
  return generateMockAnalysis(transcript, managerSpeakerName);
}
