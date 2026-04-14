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
  it("shows auth modal when user is not authenticated", () => {
    render(<App />);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });

  it("shows auth modal even when navigating to /dashboard", () => {
    window.history.pushState({}, "", "/dashboard");
    render(<App />);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });
});
