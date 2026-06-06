"use client";

import { useState } from "react";
import ContactAdminForm from "@/components/support/ContactAdminForm";
import type { ContactAdminFormState } from "@/components/support/contact-admin-types";
import { contactAdmin } from "@/lib/admin-claim/client";

export default function ContactAdminSection({
  sourcePage = "/hubungi-admin",
}: {
  sourcePage?: string;
}) {
  const [state, setState] = useState<ContactAdminFormState>({
    subject: "",
    description: "",
    evidence: "",
    loading: false,
    success: null,
    error: null,
  });

  async function handleSubmit() {
    setState((current) => ({ ...current, loading: true, error: null, success: null }));
    try {
      await contactAdmin({
        subject: state.subject,
        description: state.description,
        evidence: state.evidence,
        sourcePage,
      });
      setState({
        subject: "",
        description: "",
        evidence: "",
        loading: false,
        success: "Pesan berhasil dikirim ke admin PantauDesa.",
        error: null,
      });
    } catch (error) {
      setState((current) => ({
        ...current,
        loading: false,
        error: error instanceof Error ? error.message : "Gagal mengirim pesan ke admin.",
      }));
    }
  }

  return (
    <ContactAdminForm
      state={state}
      onChange={(field, value) =>
        setState((current) => ({ ...current, [field]: value, error: null, success: null }))
      }
      onSubmit={handleSubmit}
    />
  );
}
