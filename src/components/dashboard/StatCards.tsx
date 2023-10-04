"use client";

import { Card, CardContent } from "@/components/ui/card";
import {
  MessageCircleQuestion,
  ListChecks,
  Lightbulb,
  AlertTriangle,
  Sparkles,
  CheckCircle2,
} from "lucide-react";

interface StatCardsProps {
  managerQuestions: number;
  reportQuestions: number;
  managerTopics: number;
  reportTopics: number;
  actionItemCount: number;
  flagged: boolean;
}

export default function StatCards({
  managerQuestions,
  reportQuestions,
  managerTopics,
  reportTopics,
  actionItemCount,
  flagged,
}: StatCardsProps) {
  const totalQuestions = managerQuestions + reportQuestions;
  const questionRatioPct =
    totalQuestions > 0 ? Math.round((reportQuestions / totalQuestions) * 100) : 50;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 h-full">
      {/* Questions Asked Card */}
      <Card className="apple-card uiverse-card-lift rounded-2xl flex flex-col justify-between">
        <CardContent className="p-5">
          <div className="flex items-start justify-between mb-3">
            <div className="p-2.5 rounded-full text-[#8B6FBD] bg-[#FCE4E8] border border-[#F5BEC6]">
              <MessageCircleQuestion className="w-5 h-5" />
            </div>
            {flagged ? (
              <div className="px-2.5 py-1 rounded-full flex items-center gap-1 text-[11px] font-bold bg-[#FFE3E8] text-[#E06D83] border border-[#F5BEC6]">
                <AlertTriangle className="w-3 h-3" />
                <span>Threshold Alert</span>
              </div>
            ) : (
              <div className="px-2.5 py-1 rounded-full flex items-center gap-1 text-[11px] font-bold text-[#8B6FBD] bg-[#FCE4E8] border border-[#F5BEC6]">
                <CheckCircle2 className="w-3 h-3" />
                <span>Balanced</span>
              </div>
            )}
          </div>

          <div className="uiverse-tooltip-container inline-block mb-1">
            <p className="text-[11px] font-extrabold text-[#665578] uppercase tracking-wider">
              Questions Asked Ratio
            </p>
            <span className="uiverse-tooltip">Goal: 50%+ ratio of report-asked questions</span>
          </div>
          <div className="flex items-baseline justify-between mb-2">
            <span className="text-3xl font-extrabold text-[#241830]">
              {totalQuestions}
            </span>
            <span className="text-xs font-bold text-[#665578]">
              {questionRatioPct}% asked by report
            </span>
          </div>

          {/* Question Ratio Progress Bar */}
          <div className="space-y-1.5 mt-2">
            <div className="h-2.5 bg-[#FFF4F6] rounded-full overflow-hidden flex border border-[#F5BEC6]">
              <div
                className="h-full rounded-l-full transition-all duration-500"
                style={{
                  width: `${managerQuestions + reportQuestions > 0 ? (managerQuestions / totalQuestions) * 100 : 50}%`,
                  backgroundColor: "#E06D83",
                }}
              />
              <div
                className="h-full rounded-r-full transition-all duration-500"
                style={{
                  width: `${managerQuestions + reportQuestions > 0 ? (reportQuestions / totalQuestions) * 100 : 50}%`,
                  backgroundColor: "#8B6FBD",
                }}
              />
            </div>
            <div className="flex justify-between text-[11px] font-bold">
              <span className="text-[#E06D83]">Manager: {managerQuestions}</span>
              <span className="text-[#8B6FBD]">Report: {reportQuestions}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Items Extracted Card */}
      <Card className="apple-card uiverse-card-lift rounded-2xl flex flex-col justify-between">
        <CardContent className="p-5">
          <div className="flex items-start justify-between mb-3">
            <div className="p-2.5 rounded-full text-[#E06D83] bg-[#FCE4E8] border border-[#F5BEC6]">
              <ListChecks className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-extrabold text-[#E06D83] bg-[#FCE4E8] border border-[#F5BEC6] px-2.5 py-1 rounded-full uppercase">
              Extracted
            </span>
          </div>

          <div className="uiverse-tooltip-container inline-block mb-1">
            <p className="text-[11px] font-extrabold text-[#665578] uppercase tracking-wider">
              Agreed Commitments
            </p>
            <span className="uiverse-tooltip">Commitments AI-extracted from transcript</span>
          </div>
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-3xl font-extrabold text-[#241830]">
              {actionItemCount}
            </span>
            <span className="text-xs font-bold text-[#665578]">items extracted</span>
          </div>

          <div className="p-2.5 bg-[#FFF4F6] border border-[#F5BEC6] rounded-xl text-xs font-semibold text-[#241830] flex items-center gap-2 mt-2">
            <Sparkles className="w-4 h-4 text-[#8B6FBD] shrink-0" />
            <span>AI extracted actionable next steps</span>
          </div>
        </CardContent>
      </Card>

      {/* Topic Initiation Split Card */}
      <Card className="apple-card uiverse-card-lift rounded-2xl sm:col-span-2">
        <CardContent className="p-5">
          <div className="flex items-start justify-between mb-3">
            <div className="p-2.5 rounded-full text-[#8B6FBD] bg-[#FCE4E8] border border-[#F5BEC6]">
              <Lightbulb className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-[#665578] bg-[#FCE4E8] border border-[#F5BEC6] px-3 py-1 rounded-full">
              Agenda Origins
            </span>
          </div>

          <div className="uiverse-tooltip-container inline-block mb-2">
            <p className="text-[11px] font-extrabold text-[#665578] uppercase tracking-wider">
              Topic Initiation Split
            </p>
            <span className="uiverse-tooltip">Which party introduced each agenda point</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="flex justify-between text-xs font-bold mb-2">
                <span className="text-[#E06D83]">
                  Manager Introduced: {managerTopics} topics
                </span>
                <span className="text-[#8B6FBD]">
                  Report Introduced: {reportTopics} topics
                </span>
              </div>

              <div className="h-2.5 bg-[#FFF4F6] rounded-full overflow-hidden flex border border-[#F5BEC6]">
                <div
                  className="h-full rounded-l-full transition-all duration-500"
                  style={{
                    width: `${
                      managerTopics + reportTopics > 0
                        ? (managerTopics / (managerTopics + reportTopics)) * 100
                        : 50
                    }%`,
                    backgroundColor: "#E06D83",
                  }}
                />
                <div
                  className="h-full rounded-r-full transition-all duration-500"
                  style={{
                    width: `${
                      managerTopics + reportTopics > 0
                        ? (reportTopics / (managerTopics + reportTopics)) * 100
                        : 50
                    }%`,
                    backgroundColor: "#8B6FBD",
                  }}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
