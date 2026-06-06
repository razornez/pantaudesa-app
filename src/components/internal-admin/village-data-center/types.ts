export type VillageDataCenterTab = "standards" | "desa-data" | "versions" | "activity";

export interface FieldStandard {
  sectionKey: string;
  sectionLabel: string;
  fieldKey: string;
  fieldLabel: string;
  publishableNow: boolean;
  aiDetectable: boolean;
  currentModelSource: string;
  sourceRequirement?: string;
  validationRequirement?: string;
  deferredReason?: string | null;
}

export interface DbField {
  fieldKey: string;
  label: string;
  valueType: string;
  isPublishableNow: boolean;
  componentKey: string;
  componentLabel: string;
}

export interface FieldStandardsData {
  templateKey: string;
  templateName: string;
  source: "db" | "fallback";
  totalFields: number;
  publishableCount: number;
  holdCount: number;
  visibleComponents?: Array<{
    componentId: string;
    componentKey: string;
    label: string;
    displayOrder: number;
    fields: DbField[];
  }>;
  sections?: Array<{
    sectionKey: string;
    sectionLabel: string;
    fields: FieldStandard[];
  }>;
}

export interface TemplateCatalogField {
  fieldKey: string;
  label: string;
  valueType: string;
  isPublishableNow: boolean;
  displayOrder: number;
}

export interface TemplateCatalogComponent {
  componentKey: string;
  label: string;
  description: string;
  componentType: string;
  isDefaultVisible: boolean;
  displayOrder: number;
  rendererType: string;
  previewVariant: string;
  detailSlot: string;
  navLabel: string;
  anchorId: string;
  publicGroupKey: string | null;
  publicTabKey: string | null;
  highlightFieldKeys?: string[];
  renderConfig: Record<string, unknown>;
  fieldCount: number;
  fields: TemplateCatalogField[];
  source: "db" | "manifest";
}

export interface TemplateSummary {
  id: string;
  key: string;
  name: string;
  description: string | null;
  status: string;
  isDefault: boolean;
  version: number;
  componentCount: number;
  assignedDesaCount: number;
  updatedAt: string;
}

export interface TemplateEditorComponent extends TemplateCatalogComponent {
  componentId: string | null;
}

export interface TemplateDetail extends TemplateSummary {
  components: TemplateEditorComponent[];
  deleteBlockedReason: string | null;
}

export interface TemplateWorkspaceData {
  templates: TemplateSummary[];
  selectedTemplateId: string | null;
  selectedTemplate: TemplateDetail | null;
  availableComponents: TemplateCatalogComponent[];
  catalogSource: "db" | "manifest";
  readOnly?: boolean;
  readOnlyReason?: string | null;
}

export interface DesaComponent {
  componentId: string;
  componentKey: string;
  label: string;
  displayOrder: number;
  isVisible: boolean;
  fieldCount: number;
  filledFieldCount: number;
  totalFieldCount: number;
  completionStatus: "empty" | "partial" | "complete";
  filledFieldLabels: string[];
  missingFieldLabels: string[];
  teaserLabels: string[];
  derivedSignals: string[];
}

export interface DesaComponentData {
  templateKey: string;
  templateName: string;
  source: "db" | "fallback";
  visibleComponents: DesaComponent[];
  hiddenComponents: DesaComponent[];
  totalFields: number;
  publishableCount: number;
  filledFieldCount?: number;
  filledSignalCount?: number;
  totalSignalCount?: number;
  mismatchPublishedFieldCount?: number;
}

export interface DesaRow {
  id: string;
  nama: string;
  slug: string;
  kecamatan: string;
  kabupaten: string;
  provinsi: string;
  websiteUrl: string | null;
  kategori: string | null;
  tahunData: number | null;
  jumlahPenduduk: number | null;
  dataStatus: string;
  dataSourceLabel: string | null;
  dataPublishedAt: string | null;
  filledFieldCount?: number;
  totalFieldCount?: number;
  filledSignalCount?: number;
  totalSignalCount?: number;
  mismatchPublishedFieldCount?: number;
  _count: { villageDataVersions: number };
  detailTemplateAssignment?: {
    template: { id: string; key: string; name: string };
  } | null;
}

export interface VersionRow {
  id: string;
  desaId: string;
  versionNumber: number;
  status: string;
  title: string;
  sourceLabel: string | null;
  changedFields: string[];
  reviewNote: string | null;
  publishedAt: string | null;
  createdAt: string;
  desa: { nama: string; kecamatan: string; kabupaten: string };
}

export interface AuditRow {
  id: string;
  desaId: string;
  eventType: string;
  eventLabel: string | null;
  actorRole: string | null;
  note: string | null;
  createdAt: string;
  desa: { nama: string };
}
