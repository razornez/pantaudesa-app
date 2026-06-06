"use client";

import { IntakeSection } from "./IntakeSection";
import { IntakeHistoryList } from "./IntakeHistoryList";
import { DesaVersionHistoryList } from "./DesaVersionHistoryList";
import type {
  DesaVersionHistoryResponse,
  IntakeHistoryResponse,
} from "./types";

export function IntakeHistoryPanels({
  desaName,
  intakeHistory,
  intakeHistoryError,
  intakeHistoryLoading,
  versionHistory,
  versionHistoryError,
  versionHistoryLoading,
}: {
  desaName: string | null;
  intakeHistory: IntakeHistoryResponse | null;
  intakeHistoryError: string | null;
  intakeHistoryLoading: boolean;
  versionHistory: DesaVersionHistoryResponse | null;
  versionHistoryError: string | null;
  versionHistoryLoading: boolean;
}) {
  return (
    <>
      <IntakeSection title="Riwayat Intake" defaultOpen={false}>
        <IntakeHistoryList
          loading={intakeHistoryLoading}
          error={intakeHistoryError}
          submissions={intakeHistory?.submissions ?? []}
          storageNote={intakeHistory?.storage.note ?? null}
        />
      </IntakeSection>

      <IntakeSection title="Riwayat Versi Desa" defaultOpen={false}>
        <DesaVersionHistoryList
          desaName={desaName}
          loading={versionHistoryLoading}
          error={versionHistoryError}
          versions={versionHistory?.versions ?? []}
          storageNote={versionHistory?.storage.note ?? null}
        />
      </IntakeSection>
    </>
  );
}
