/**
 * Intake Workbench Components
 *
 * Types, constants, utils, hooks, and all v2 result-step components.
 */

// Types
export * from "./types";

// Constants
export * from "./constants";

// Utils
export * from "./utils";

// Hooks
export * from "./hooks";

// Shared UI
export { IntakeSection, IntakeCompactSection } from "./IntakeSection";

// Status helpers
export {
  getMappingStatus,
  getValidationStatus,
  getReviewStatus,
  getOpenAiStatus,
  getMappedFieldEntries,
  getChangedFieldList,
  getReviewableContentCount,
  canSubmitToReview,
} from "./IntakeStatusHelpers";

// v2 result step components
export { IntakeSourceRibbon }    from "./IntakeSourceRibbon";
export { IntakeDiffTheatre }     from "./IntakeDiffTheatre";
export { IntakeCoverageLens }    from "./IntakeCoverageLens";
export { IntakeValidationPanel } from "./IntakeValidationPanel";
export { IntakeDetectedGallery } from "./IntakeDetectedGallery";
export { IntakeInfoStrip }       from "./IntakeInfoStrip";
export { IntakeInspectorDrawer } from "./IntakeInspectorDrawer";
