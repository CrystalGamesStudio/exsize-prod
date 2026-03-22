import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";

vi.mock("@/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/api")>();
  return {
    ...actual,
    login: vi.fn(),
    register: vi.fn(),
    getMe: vi.fn(),
    setToken: vi.fn(),
    getToken: vi.fn(() => null),
  };
});

import App from "@/App";

describe("Auth guard", () => {
  it("redirects unauthenticated user to login page", () => {
    render(<App />);
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });

  it("redirects /dashboard to login when not authenticated", () => {
    window.history.pushState({}, "", "/dashboard");
    render(<App />);
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
  });
});
