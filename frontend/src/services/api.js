const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:8000").replace(/\/$/, "");

function apiPath(path) {
  return path?.startsWith("/") ? `${API_URL}${path}` : path;
}

async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, options);
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(body?.detail || "The server could not complete that request.");
  }
  return body;
}

// These functions are the only frontend-facing API boundary. Replace their
// internals—not component code—if the backend contract evolves.
export async function uploadBankStatement(file) {
  const form = new FormData();
  form.append("file", file);
  return request("/api/upload/bank-statement", { method: "POST", body: form });
}

export async function uploadReceipts(files, sessionId) {
  const form = new FormData();
  form.append("session_id", sessionId);
  [...files].forEach((file) => form.append("files", file));
  return request("/api/upload/receipts", { method: "POST", body: form });
}

export async function runReconciliation(sessionId) {
  await request("/api/extract-receipts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ session_id: sessionId })
  });
  const report = await request("/api/reconcile", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ session_id: sessionId })
  });
  return report.results.map((result) => ({ ...result, receipt_image: apiPath(result.receipt_image) }));
}
