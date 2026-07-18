// Small fetch wrapper so the rest of the app never deals with HTTP details.
async function request(path, { method = "GET", body, headers } = {}) {
  const res = await fetch(`/api/v1${path}`, {
    method,
    headers: { ...(body && { "content-type": "application/json" }), ...headers },
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const error = new Error(data?.error?.message ?? `Request failed (${res.status})`);
    error.code = data?.error?.code;
    throw error;
  }
  return data;
}

export const http = {
  get: (path, opts) => request(path, opts),
  post: (path, body, opts) => request(path, { ...opts, method: "POST", body }),
  patch: (path, body, opts) => request(path, { ...opts, method: "PATCH", body }),
};

export const adminHeaders = (adminId) => ({ "x-admin-id": adminId });
