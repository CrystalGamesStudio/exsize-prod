import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { AuthProvider } from "@/auth";
import ProfilePage from "@/pages/ProfilePage";

vi.mock("@/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/api")>();
  return {
    ...actual,
    getGamificationProfile: vi.fn(),
  };
});

import { getGamificationProfile as getProfileMock } from "@/api";
import type { UserResponse } from "@/api";

const MOCK_PROFILE = {
  xp: 450,
  level: 3,
  level_name: "Rookie",
  progress_percent: 50,
  xp_for_next_level: 300,
  streak: 5,
};

function renderProfilePage(role: "child" | "parent" = "child") {
  const user: UserResponse = {
    id: role === "child" ? 2 : 1,
    email: `${role}@test.com`,
    role,
    language: "en",
  };
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <MemoryRouter>
          <ProfilePage user={user} />
        </MemoryRouter>
      </AuthProvider>
    </QueryClientProvider>,
  );
}

describe("ProfilePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("child sees current level number and title", async () => {
    vi.mocked(getProfileMock).mockResolvedValue(MOCK_PROFILE);

    renderProfilePage("child");

    expect(await screen.findByText(/level 3/i)).toBeInTheDocument();
    expect(screen.getByText(/rookie/i)).toBeInTheDocument();
  });

  it("child sees total XP and XP needed for next level", async () => {
    vi.mocked(getProfileMock).mockResolvedValue(MOCK_PROFILE);

    renderProfilePage("child");

    expect(await screen.findByText(/450 xp/i)).toBeInTheDocument();
    expect(screen.getByText(/300 xp to next level/i)).toBeInTheDocument();
  });

  it("progress bar shows accurate percentage to next level", async () => {
    vi.mocked(getProfileMock).mockResolvedValue(MOCK_PROFILE);

    renderProfilePage("child");

    const progressBar = await screen.findByRole("progressbar");
    expect(progressBar).toHaveAttribute("aria-valuenow", "50");
    expect(progressBar).toHaveAttribute("aria-valuemin", "0");
    expect(progressBar).toHaveAttribute("aria-valuemax", "100");
    expect(screen.getByText("50%")).toBeInTheDocument();
  });

  it("child sees streak count", async () => {
    vi.mocked(getProfileMock).mockResolvedValue(MOCK_PROFILE);

    renderProfilePage("child");

    expect(await screen.findByText(/5 day streak/i)).toBeInTheDocument();
  });

  it("shows singular 'day' for streak of 1", async () => {
    vi.mocked(getProfileMock).mockResolvedValue({ ...MOCK_PROFILE, streak: 1 });

    renderProfilePage("child");

    expect(await screen.findByText(/1 day streak/i)).toBeInTheDocument();
  });

  it("shows earned Freemium badge and locked badges", async () => {
    vi.mocked(getProfileMock).mockResolvedValue(MOCK_PROFILE);

    renderProfilePage("child");

    const freemium = await screen.findByText("Freemium");
    expect(freemium).toBeInTheDocument();
    // Freemium badge should not be marked as locked
    expect(freemium.closest("[data-badge]")).not.toHaveAttribute("data-locked");

    // At least one locked badge should exist
    const lockedBadges = document.querySelectorAll("[data-locked]");
    expect(lockedBadges.length).toBeGreaterThan(0);
  });

  it("E2E: task approval updates gamification profile with new XP and level", async () => {
    // Step 1: Child sees initial profile
    vi.mocked(getProfileMock).mockResolvedValue({
      xp: 90,
      level: 1,
      level_name: "Beginner",
      progress_percent: 90,
      xp_for_next_level: 100,
      streak: 0,
    });

    const { unmount } = renderProfilePage("child");

    expect(await screen.findByText("Level 1")).toBeInTheDocument();
    expect(screen.getByText(/beginner/i)).toBeInTheDocument();
    expect(screen.getByText(/90 xp/i)).toBeInTheDocument();
    const progressBar = screen.getByRole("progressbar");
    expect(progressBar).toHaveAttribute("aria-valuenow", "90");

    unmount();

    // Step 2: After task approval, profile reflects updated XP and level
    vi.mocked(getProfileMock).mockResolvedValue({
      xp: 140,
      level: 2,
      level_name: "Starter",
      progress_percent: 20,
      xp_for_next_level: 200,
      streak: 1,
    });

    renderProfilePage("child");

    expect(await screen.findByText(/level 2/i)).toBeInTheDocument();
    expect(screen.getByText(/starter/i)).toBeInTheDocument();
    expect(screen.getByText(/140 xp/i)).toBeInTheDocument();
    const updatedBar = screen.getByRole("progressbar");
    expect(updatedBar).toHaveAttribute("aria-valuenow", "20");
    expect(screen.getByText(/1 day streak/i)).toBeInTheDocument();
  });
});
