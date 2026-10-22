import type { ApiErrorBody, Candidate, User } from "../types";

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8080"
).replace(/\/+$/, "");

function isFormData(body: BodyInit | null | undefined): boolean {
  return typeof FormData !== "undefined" && body instanceof FormData;
}

async function readResponseBody(response: Response): Promise<unknown> {
  if (response.status === 204 || response.status === 205) return null;

  const contentType = response.headers.get("content-type") ?? "";
  const text = await response.text();
  if (!text.trim()) return null;

  if (contentType.includes("json") || contentType.includes("+json")) {
    try {
      return JSON.parse(text) as unknown;
    } catch {
      throw new Error("Server mengirim respons JSON yang tidak valid.");
    }
  }

  return text;
}

function errorMessage(body: unknown, status: number): string {
  if (typeof body === "string" && body.trim()) return body.trim();
  if (body && typeof body === "object") {
    const errorBody = body as ApiErrorBody & { detail?: string; title?: string };
    const message = errorBody.message || errorBody.error || errorBody.detail || errorBody.title;
    if (message) return message;
  }

  if (status === 401) return "Sesi berakhir atau Anda belum login. Silakan login kembali.";
  if (status === 403) return "Anda tidak memiliki izin untuk melakukan tindakan ini.";
  if (status === 404) return "Endpoint atau data yang diminta tidak ditemukan.";
  if (status === 409) return "Permintaan bertentangan dengan kondisi data saat ini.";
  if (status >= 500) return "Terjadi kesalahan pada server. Silakan coba lagi.";
  return `Permintaan gagal (HTTP ${status}).`;
}

export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set("Accept", "application/json");

  if (options.body != null && !isFormData(options.body) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers,
      credentials: "include",
    });
  } catch {
    throw new Error("Tidak dapat terhubung ke server. Periksa URL API, koneksi jaringan, dan konfigurasi CORS.");
  }

  let body: unknown;
  try {
    body = await readResponseBody(response);
  } catch {
    if (!response.ok) {
      throw new Error(`Permintaan gagal (HTTP ${response.status}); respons server tidak dapat dibaca.`);
    }
    throw new Error("Server mengirim respons yang tidak dapat dibaca.");
  }

  if (!response.ok) throw new Error(errorMessage(body, response.status));
  return body as T;
}

interface DashboardVoter {
  id: string;
  nim: string;
  name: string;
  kelompok: string;
  hasVoted: boolean;
}

interface AdminDashboard {
  user: User;
  candidates: Candidate[];
  totalVoters: number;
  totalVotes: number;
  votedCount: number;
  notVotedCount: number;
  voters: DashboardVoter[];
  voting: {
    isConfigured: boolean;
    isOpen: boolean;
    status: string;
    openAt?: string;
    closeAt?: string;
    openAtInput: string;
    closeAtInput: string;
  };
}

type CandidatePayload = Omit<Candidate, "id" | "voteCount">;

function toWIBTimestamp(value: string): string {
  // datetime-local dari input tidak membawa timezone; jadwal voting menggunakan WIB (UTC+07:00).
  if (!value) return value;
  if (/[zZ]|[+-]\d{2}:?\d{2}$/.test(value)) return new Date(value).toISOString();
  return `${value.length === 16 ? `${value}:00` : value}+07:00`;
}

export const api = {
login: (nim: string, password: string) =>
  apiRequest<{ user: User; redirectTo?: string }>("/api/v1/auth/login", {
    method: "POST",
    body: JSON.stringify({ nim, password }),
  }),

  me: () => apiRequest<{ user: User }>("/api/v1/auth/me"),

  logout: () => apiRequest<{ message?: string }>("/api/v1/auth/logout", { method: "POST" }),

  candidates: () => apiRequest<{ candidates: Candidate[] }>("/api/v1/candidates"),

  vote: (candidateId: string) =>
    apiRequest<{ success?: boolean; message?: string; code?: string; redirectTo?: string }>("/api/v1/votes", {
      method: "POST",
      body: JSON.stringify({ candidateId }),
    }),

  adminDashboard: () => apiRequest<AdminDashboard>("/api/v1/admin/dashboard"),

  updateVoting: (openAt: string, closeAt: string) =>
    apiRequest<{ message?: string; openAt?: string; closeAt?: string }>("/api/v1/admin/voting-settings", {
      method: "PUT",
      body: JSON.stringify({ openAt: toWIBTimestamp(openAt), closeAt: toWIBTimestamp(closeAt) }),
    }),

  createCandidate: (payload: CandidatePayload) =>
    apiRequest<{ id?: string; message?: string }>("/api/v1/admin/candidates", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  updateCandidate: (id: string, payload: CandidatePayload) =>
    apiRequest<{ message?: string }>(`/api/v1/admin/candidates/${encodeURIComponent(id)}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),

  deleteCandidate: (id: string) =>
    apiRequest<{ message?: string }>(`/api/v1/admin/candidates/${encodeURIComponent(id)}`, {
      method: "DELETE",
    }),

  results: () =>
    apiRequest<{ results: Candidate[]; totalVotes: number }>("/api/v1/admin/results"),
};
