export interface ContactAdminFormState {
  subject: string;
  description: string;
  evidence: string;
  loading: boolean;
  success: string | null;
  error: string | null;
}
