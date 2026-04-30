const API_BASE_URL = (import.meta.env?.VITE_API_BASE_URL ?? "").replace(/\/$/, "");

export async function sendAssessment(data) {
  const res = await fetch(`${API_BASE_URL}/api/assessment`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Assessment sync failed (${res.status}): ${text}`);
  }

  // Keep behavior flexible if server returns plain text.
  const contentType = res.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) return await res.json();
  return await res.text();
}