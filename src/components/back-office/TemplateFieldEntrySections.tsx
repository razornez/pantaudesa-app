"use client";

import type { TemplateFieldSectionViewModel } from "@/lib/village-data/template-field-contract";

interface Props {
  sections: TemplateFieldSectionViewModel[];
  values: Record<string, string>;
  onChange: (fieldKey: string, value: string) => void;
  disabled?: boolean;
}

function FieldInput({
  field,
  value,
  onChange,
  disabled,
}: {
  field: TemplateFieldSectionViewModel["fields"][number];
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  const className = "field-lux text-sm";

  if (field.valueType === "text" || field.valueType === "json") {
    return (
      <textarea
        rows={field.valueType === "json" ? 5 : 4}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        placeholder={
          field.valueType === "json"
            ? "Isi JSON valid, misalnya object atau array."
            : `Isi ${field.label.toLowerCase()}`
        }
        className={`${className} min-h-[120px] resize-y`}
      />
    );
  }

  return (
    <input
      type={field.valueType === "number" ? "number" : field.valueType === "email" ? "email" : "text"}
      inputMode={field.valueType === "number" ? "decimal" : undefined}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      disabled={disabled}
      placeholder={`Isi ${field.label.toLowerCase()}`}
      className={className}
    />
  );
}

export function TemplateFieldEntrySections({
  sections,
  values,
  onChange,
  disabled = false,
}: Props) {
  return (
    <div className="space-y-4">
      {sections.map((section) => (
        <section
          key={section.componentId}
          className="rounded-[26px] border border-slate-200 bg-white/85 p-4 shadow-sm sm:p-5"
        >
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="eyebrow text-[10px]">{section.componentKey.replaceAll("_", " ")}</p>
              <h3 className="text-[16px] font-semibold tracking-tight text-slate-900">
                {section.label}
              </h3>
            </div>
            <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold text-slate-600">
              {section.fields.length} field aktif
            </span>
          </div>

          <div className="grid gap-3">
            {section.fields.map((field) => (
              <div
                key={`${section.componentId}:${field.fieldKey}`}
                className="rounded-2xl border border-slate-200 bg-slate-50/75 p-3"
              >
                <div className="mb-2 flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <label className="field-label text-xs">{field.label}</label>
                    <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
                      {field.sourcePolicy.allowedSourceTypes.join(" · ")}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                        field.isPublishableNow ? "pill-ok" : "pill-muted"
                      }`}
                    >
                      {field.isPublishableNow ? "Publishable setelah review" : "Aktif, belum publishable"}
                    </span>
                    {field.sourcePolicy.requiresEvidence ? (
                      <span className="inline-flex rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700 shadow-[inset_0_0_0_1px_rgba(180,83,9,0.12)]">
                        Butuh evidence
                      </span>
                    ) : null}
                  </div>
                </div>

                <FieldInput
                  field={field}
                  value={values[field.fieldKey] ?? ""}
                  onChange={(nextValue) => onChange(field.fieldKey, nextValue)}
                  disabled={disabled}
                />
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
