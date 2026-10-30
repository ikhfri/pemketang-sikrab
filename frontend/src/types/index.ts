
export type UserRole = "ADMIN" | "VOTER";

export interface User {
  id: string;
  name: string;
  nim?: string;
  kelompok?: string | null;
  role: UserRole;
  hasVoted?: boolean;
}

export interface Candidate {
  id: string;
  ketuaName: string;
  wakilName: string;
  photoUrl: string | null;
  vision: string | null;
  mission: string | null;
  voteCount?: number;
}

export interface ApiErrorBody {
  message?: string;
  error?: string;
  code?: string;
}
