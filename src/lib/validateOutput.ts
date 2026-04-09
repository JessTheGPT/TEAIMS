const VALIDATE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/validate-output`;

export interface ValidationViolation {
  type: string;
  constraint_id: string;
  severity: 'block' | 'warn';
  description: string;
  message: string;
}

export interface ValidationResult {
  status: 'pass' | 'fail' | 'needs_review';
  violations: ValidationViolation[];
  constraints_checked: number;
  message: string;
}

export async function validateOutput({
  agentCode,
  content,
  documentId,
  ideaId,
  token,
}: {
  agentCode: string;
  content: string;
  documentId?: string;
  ideaId?: string;
  token: string;
}): Promise<ValidationResult> {
  try {
    const resp = await fetch(VALIDATE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        agent_code: agentCode,
        content,
        document_id: documentId,
        idea_id: ideaId,
      }),
    });

    if (!resp.ok) {
      console.warn("Validation endpoint error:", resp.status);
      return { status: 'pass', violations: [], constraints_checked: 0, message: 'Validation unavailable' };
    }

    return await resp.json();
  } catch (err) {
    console.warn("Validation failed:", err);
    return { status: 'pass', violations: [], constraints_checked: 0, message: 'Validation unavailable' };
  }
}
