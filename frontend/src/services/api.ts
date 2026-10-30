import type { ApiErrorBody, Candidate, User } from "../types";

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8080"
).replace(/\/+$/, "");


function isFormData(body: BodyInit | null | undefined): boolean {
  return typeof FormData !== "undefined" && body instanceof FormData;
}

async function readResponseBody(response: Response): Promise<unknown> {
  if (response.status === 204 || response.status === 205) {
    return null;
  }

  const contentType = response.headers.get("content-type") ?? "";
  const responseText = await response.text();

  if (!responseText.trim()) {
    return null;
  }

  if (
    contentType.includes("application/json") ||
    contentType.includes("+json")
  ) {
    try {
      return JSON.parse(responseText) as unknown;
    } catch {
      throw new Error("Server mengirim respons JSON yang tidak valid.");
    }
  }

  return responseText;
}

function getErrorMessage(body: unknown, status: number): string {
  if (typeof body === "string" && body.trim()) {
    return body.trim();
  }

  if (body && typeof body === "object") {
    const errorBody = body as Partial<ApiErrorBody> & {
      detail?: string;
      title?: string;
    };

    const message =
      errorBody.message ??
      errorBody.error ??
      errorBody.detail ??
      errorBody.title;

    if (typeof message === "string" && message.trim()) {
      return message.trim();
    }
  }

  switch (status) {
    case 400:
      return "Permintaan tidak valid. Periksa kembali data yang dikirim.";
    case 401:
      return "Sesi berakhir atau Anda belum login. Silakan login kembali.";
    case 403:
      return "Anda tidak memiliki izin untuk melakukan tindakan ini.";
    case 404:
      return "Endpoint atau data yang diminta tidak ditemukan.";
    case 409:
      return "Permintaan bertentangan dengan kondisi data saat ini.";
    case 422:
      return "Data yang dikirim tidak dapat diproses. Periksa kembali input Anda.";
    default:
      if (status >= 500) {
        return "Terjadi kesalahan pada server. Silakan coba lagi.";
      }

      return `Permintaan gagal (HTTP ${status}).`;
  }
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set("Accept", "application/json");

  // Browser harus mengatur Content-Type multipart/form-data beserta boundary.
  if (
    options.body != null &&
    !isFormData(options.body) &&
    !headers.has("Content-Type")
  ) {
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
    throw new Error(
      "Tidak dapat terhubung ke server. Periksa URL API, koneksi jaringan, dan konfigurasi CORS.",
    );
  }

  let body: unknown;

  try {
    body = await readResponseBody(response);
  } catch (error) {
    if (!response.ok) {
      throw new Error(
        `Permintaan gagal (HTTP ${response.status}); respons server tidak dapat dibaca.`,
      );
    }

    throw error;
  }

  if (!response.ok) {
    throw new Error(getErrorMessage(body, response.status));
  }

  return body as T;
}

/**
 * Mengirim file Excel sebagai multipart/form-data.
 * Jangan mengatur Content-Type secara manual karena browser perlu menambahkan boundary.
 */
async function uploadForm<T>(path: string, file: File): Promise<T> {
  const formData = new FormData();
  formData.append("file", file);

  return apiRequest<T>(path, {
    method: "POST",
    body: formData,
  });
}

/**
 * Mengirim file Excel dan menerima hasil import berupa CSV.
 */
async function downloadImportResult(path: string, file: File): Promise<Blob> {
  const formData = new FormData();
  formData.append("file", file);

  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method: "POST",
      body: formData,
      credentials: "include",
      headers: {
        Accept: "text/csv, application/json",
      },
    });
  } catch {
    throw new Error(
      "Tidak dapat terhubung ke server. Periksa URL API dan koneksi jaringan.",
    );
  }

  if (!response.ok) {
    let body: unknown;

    try {
      body = await readResponseBody(response);
    } catch {
      throw new Error(
        `Import gagal (HTTP ${response.status}); respons server tidak dapat dibaca.`,
      );
    }

    throw new Error(getErrorMessage(body, response.status));
  }

  return response.blob();
}

type DashboardVoter = {
  id: string;
  nim?: string;
  name: string;
  kelompok?: string;
  hasVoted: boolean;
};

type AdminDashboard = {
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
    openAtInput?: string;
    closeAtInput?: string;
  };
};

type CandidatePayload = Omit<Candidate, "id" | "voteCount">;

export type ImportPreview = {
  total_rows: number;
  valid_rows: number;
  invalid_rows: number;
  existing_nims: number;
  valid_preview: Array<Record<string, unknown>>;
  errors: Array<Record<string, unknown>>;
  note?: string;
};

export const api = {
  // Authentication
  login: (nim: string, password: string) =>
    apiRequest<{
      user?: User;
      role?: string;
      message?: string;
    }>("/api/v1/auth/login", {
      method: "POST",
      body: JSON.stringify({ nim, password }),
    }),

  me: () => apiRequest<{ user: User }>("/api/v1/auth/me"),

  logout: () =>
    apiRequest<{ message?: string } | null>("/api/v1/auth/logout", {
      method: "POST",
    }),

  // Public candidates
  candidates: () =>
    apiRequest<{ candidates: Candidate[] }>("/api/v1/candidates"),

  // Voting
  vote: (candidateId: string) =>
    apiRequest<{ message?: string; code?: string }>("/api/v1/votes", {
      method: "POST",
      body: JSON.stringify({ candidateId }),
    }),

  // Admin dashboard
  adminDashboard: () =>
    apiRequest<AdminDashboard>("/api/v1/admin/dashboard"),

  // Voting settings
  updateVoting: (openAt: string, closeAt: string) =>
    apiRequest<{ message?: string }>("/api/v1/admin/voting-settings", {
      method: "PUT",
      body: JSON.stringify({ openAt, closeAt }),
    }),

  // Candidate management
  createCandidate: (payload: CandidatePayload) =>
    apiRequest<{ message?: string; candidate?: Candidate }>(
      "/api/v1/admin/candidates",
      {
        method: "POST",
        body: JSON.stringify(payload),
      },
    ),

  updateCandidate: (id: string, payload: CandidatePayload) =>
    apiRequest<{ message?: string; candidate?: Candidate }>(
      `/api/v1/admin/candidates/${encodeURIComponent(id)}`,
      {
        method: "PUT",
        body: JSON.stringify(payload),
      },
    ),

  deleteCandidate: (id: string) =>
    apiRequest<{ message?: string } | null>(
      `/api/v1/admin/candidates/${encodeURIComponent(id)}`,
      {
        method: "DELETE",
      },
    ),

  // Voter management
  resetVoterVote: (id: string) =>
    apiRequest<{ message?: string }>(
      `/api/v1/admin/voters/${encodeURIComponent(id)}/reset-vote`,
      {
        method: "POST",
      },
    ),

  // Results
  results: () =>
    apiRequest<{ results: Candidate[]; totalVotes: number }>(
      "/api/v1/admin/results",
    ),

  // Excel import: preview and validate file
  previewUserImport: (file: File) =>
    uploadForm<ImportPreview>("/api/v1/admin/users/import/preview", file),

  // Excel import: append voters and download CSV result
  importUsers: (file: File) =>
    downloadImportResult("/api/v1/admin/users/import", file),

  // Excel import: replace all voters and download CSV result
  replaceUsers: (file: File) =>
    downloadImportResult("/api/v1/admin/users/import/replace", file),
};
