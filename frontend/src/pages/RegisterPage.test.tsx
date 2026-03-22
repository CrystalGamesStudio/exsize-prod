import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { AuthProvider } from "@/auth";
import RegisterPage from "@/pages/RegisterPage";

vi.mock("@/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/api")>();
  return {
    ...actual,
    register: vi.fn(),
    login: vi.fn(),
    getMe: vi.fn(),
    setToken: vi.fn(),
  };
});

import {
  register as registerMock,
  login as loginMock,
  getMe as getMeMock,
} from "@/api";

function renderRegister() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <MemoryRouter initialEntries={["/register"]}>
          <RegisterPage />
        </MemoryRouter>
      </AuthProvider>
    </QueryClientProvider>,
  );
}

describe("RegisterPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders email, password, role select, and submit button", () => {
    renderRegister();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/role/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /register/i }),
    ).toBeInTheDocument();
  });

  it("calls register and login API on submit", async () => {
    const user = userEvent.setup();
    vi.mocked(registerMock).mockResolvedValue({
      id: 1,
      email: "parent@test.com",
      role: "parent",
      language: "en",
    });
    vi.mocked(loginMock).mockResolvedValue({
      access_token: "test-token",
      token_type: "bearer",
    });
    vi.mocked(getMeMock).mockResolvedValue({
      id: 1,
      email: "parent@test.com",
      role: "parent",
      language: "en",
    });

    renderRegister();
    await user.type(screen.getByLabelText(/email/i), "parent@test.com");
    await user.type(screen.getByLabelText(/password/i), "password123");
    await user.selectOptions(screen.getByLabelText(/role/i), "parent");
    await user.click(screen.getByRole("button", { name: /register/i }));

    expect(registerMock).toHaveBeenCalledWith(
      "parent@test.com",
      "password123",
      "parent",
    );
  });

  it("shows error on duplicate email", async () => {
    const user = userEvent.setup();
    vi.mocked(registerMock).mockRejectedValue(
      new Error("Email already registered"),
    );

    renderRegister();
    await user.type(screen.getByLabelText(/email/i), "dup@test.com");
    await user.type(screen.getByLabelText(/password/i), "password123");
    await user.selectOptions(screen.getByLabelText(/role/i), "parent");
    await user.click(screen.getByRole("button", { name: /register/i }));

    expect(
      await screen.findByText(/registration failed/i),
    ).toBeInTheDocument();
  });

  it("has a link to login page", () => {
    renderRegister();
    expect(screen.getByRole("link", { name: /login/i })).toHaveAttribute(
      "href",
      "/login",
    );
  });
});
