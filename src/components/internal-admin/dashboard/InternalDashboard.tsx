"use client";

import type {
  InternalDashboardRankingResponse,
  InternalDashboardSummary,
} from "@/lib/internal-admin/dashboard-types";
import { DashboardHero } from "./DashboardHero";
import { DataQualitySection } from "./DataQualitySection";
import { NextStepsPanel } from "./NextStepsPanel";
import { OperationalSnapshot } from "./OperationalSnapshot";
import { PriorityLane } from "./PriorityLane";
import { RankingExplorer } from "./RankingExplorer";
import { TrafficPanel } from "./TrafficPanel";

export function InternalDashboard({
  summary,
  initialRanking,
}: {
  summary: InternalDashboardSummary;
  initialRanking: InternalDashboardRankingResponse;
}) {
  return (
    <div className="space-y-8 sm:space-y-10" data-testid="internal-dashboard-page">
      <DashboardHero summary={summary} />
      <OperationalSnapshot summary={summary} />
      <PriorityLane items={summary.priorities} />
      <DataQualitySection summary={summary} />
      <RankingExplorer initialResponse={initialRanking} />
      <TrafficPanel summary={summary} />
      <NextStepsPanel steps={summary.nextSteps} />
    </div>
  );
}
