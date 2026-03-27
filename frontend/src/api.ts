let token: string | null = null;

export function setToken(t: string | null) {
  token = t;
}

export function getToken() {
  return token;
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> | undefined),
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  const res = await fetch(path, { ...options, headers });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(res.status, body.detail ?? "Request failed");
  }
  return res.json() as Promise<T>;
}

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export interface UserResponse {
  id: number;
  email: string;
  role: "parent" | "child" | "admin";
  language: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
}

export function login(email: string, password: string) {
  return apiFetch<TokenResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function register(
  email: string,
  password: string,
  role: "parent" | "child" | "admin",
) {
  return apiFetch<UserResponse>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, password, role }),
  });
}

export function getMe() {
  return apiFetch<UserResponse>("/api/auth/me");
}

// --- Family ---

export interface FamilyMember {
  id: number;
  email: string;
  role: string;
}

export interface FamilyResponse {
  id: number;
  pin: string;
  members: FamilyMember[];
}

export interface FamilyCreateResponse {
  id: number;
  pin: string;
}

export function getFamily() {
  return apiFetch<FamilyResponse>("/api/family");
}

export function createFamily() {
  return apiFetch<FamilyCreateResponse>("/api/family", { method: "POST" });
}

export function joinFamily(pin: string) {
  return apiFetch<{ family_id: number }>("/api/family/join", {
    method: "POST",
    body: JSON.stringify({ pin }),
  });
}

export function removeFamilyMember(userId: number) {
  return apiFetch<{ detail: string }>(`/api/family/members/${userId}`, {
    method: "DELETE",
  });
}

// --- Tasks ---

export interface TaskResponse {
  id: number;
  name: string;
  description: string;
  exbucks: number;
  status: "assigned" | "accepted" | "completed" | "approved" | "rejected";
  assigned_to: number;
  day_of_week: string | null;
  photo_url: string | null;
}

export interface TaskCreateRequest {
  name: string;
  description: string;
  exbucks: number;
  assigned_to: number;
  day_of_week?: string | null;
}

export interface TaskEditRequest {
  name: string;
  description: string;
  exbucks: number;
  assigned_to: number;
  day_of_week?: string | null;
}

export function getTasks() {
  return apiFetch<TaskResponse[]>("/api/tasks");
}

export function createTask(data: TaskCreateRequest) {
  return apiFetch<TaskResponse>("/api/tasks", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function approveTask(taskId: number) {
  return apiFetch<TaskResponse>(`/api/tasks/${taskId}/approve`, {
    method: "PATCH",
  });
}

export function rejectTask(taskId: number) {
  return apiFetch<TaskResponse>(`/api/tasks/${taskId}/reject`, {
    method: "PATCH",
  });
}

export function acceptTask(taskId: number) {
  return apiFetch<TaskResponse>(`/api/tasks/${taskId}/accept`, {
    method: "PATCH",
  });
}

export function completeTask(taskId: number, photoUrl?: string) {
  return apiFetch<TaskResponse>(`/api/tasks/${taskId}/complete`, {
    method: "PATCH",
    body: JSON.stringify({ photo_url: photoUrl ?? null }),
  });
}

export function editTask(taskId: number, data: TaskEditRequest) {
  return apiFetch<TaskResponse>(`/api/tasks/${taskId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function deleteTask(taskId: number) {
  return apiFetch<void>(`/api/tasks/${taskId}`, {
    method: "DELETE",
  });
}

// --- ExBucks ---

export interface BalanceResponse {
  balance: number;
}

export interface TransactionResponse {
  id: number;
  type: string;
  amount: number;
  description: string;
  created_at: string;
}

export interface PenaltyRequest {
  child_id: number;
  amount: number;
  reason: string;
}

export function getBalance() {
  return apiFetch<BalanceResponse>("/api/exbucks/balance");
}

export function getTransactions() {
  return apiFetch<TransactionResponse[]>("/api/exbucks/transactions");
}

export function getChildTransactions(childId: number) {
  return apiFetch<TransactionResponse[]>(
    `/api/exbucks/transactions/${childId}`,
  );
}

export function assignPenalty(data: PenaltyRequest) {
  return apiFetch<TransactionResponse>("/api/exbucks/penalty", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// --- Rewards ---

export interface RewardResponse {
  id: number;
  name: string;
  description: string;
  price: number;
}

export interface RewardCreateRequest {
  name: string;
  description: string;
  price: number;
}

export interface RewardUpdateRequest {
  name?: string;
  description?: string;
  price?: number;
}

export interface PurchaseResponse {
  id: number;
  reward_name: string;
  price: number;
  created_at: string;
}

export function getRewards() {
  return apiFetch<RewardResponse[]>("/api/rewards");
}

export function createReward(data: RewardCreateRequest) {
  return apiFetch<RewardResponse>("/api/rewards", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateReward(rewardId: number, data: RewardUpdateRequest) {
  return apiFetch<RewardResponse>(`/api/rewards/${rewardId}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export function deleteReward(rewardId: number) {
  return apiFetch<void>(`/api/rewards/${rewardId}`, {
    method: "DELETE",
  });
}

export function purchaseReward(rewardId: number) {
  return apiFetch<PurchaseResponse>(`/api/rewards/${rewardId}/purchase`, {
    method: "POST",
  });
}

export function getPurchases() {
  return apiFetch<PurchaseResponse[]>("/api/rewards/purchases");
}

export function getChildPurchases(childId: number) {
  return apiFetch<PurchaseResponse[]>(`/api/rewards/purchases/${childId}`);
}
