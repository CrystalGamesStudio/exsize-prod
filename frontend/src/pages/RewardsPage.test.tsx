import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { AuthProvider } from "@/auth";
import RewardsPage from "@/pages/RewardsPage";

vi.mock("@/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/api")>();
  return {
    ...actual,
    getRewards: vi.fn(),
    createReward: vi.fn(),
    updateReward: vi.fn(),
    deleteReward: vi.fn(),
    getMe: vi.fn(),
    setToken: vi.fn(),
  };
});

import {
  getRewards as getRewardsMock,
  createReward as createRewardMock,
  updateReward as updateRewardMock,
  deleteReward as deleteRewardMock,
} from "@/api";
import type { UserResponse } from "@/api";

function renderRewardsPage() {
  const user: UserResponse = { id: 1, email: "admin@test.com", role: "admin", language: "en" };
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <MemoryRouter>
          <RewardsPage user={user} />
        </MemoryRouter>
      </AuthProvider>
    </QueryClientProvider>,
  );
}

describe("RewardsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("admin sees list of existing rewards", async () => {
    vi.mocked(getRewardsMock).mockResolvedValue([
      { id: 1, name: "Ice Cream", description: "A scoop of ice cream", price: 50 },
      { id: 2, name: "Movie Night", description: "Pick the movie", price: 100 },
    ]);

    renderRewardsPage();

    expect(await screen.findByText("Ice Cream")).toBeInTheDocument();
    expect(screen.getByText("A scoop of ice cream")).toBeInTheDocument();
    expect(screen.getByText("50")).toBeInTheDocument();
    expect(screen.getByText("Movie Night")).toBeInTheDocument();
    expect(screen.getByText("Pick the movie")).toBeInTheDocument();
    expect(screen.getByText("100")).toBeInTheDocument();
  });

  it("admin creates a reward via form", async () => {
    const user = userEvent.setup();
    vi.mocked(getRewardsMock).mockResolvedValue([]);
    vi.mocked(createRewardMock).mockResolvedValue({
      id: 1, name: "Ice Cream", description: "A scoop", price: 50,
    });

    renderRewardsPage();

    await screen.findByText("No rewards yet.");

    await user.type(screen.getByLabelText(/name/i), "Ice Cream");
    await user.type(screen.getByLabelText(/description/i), "A scoop");
    await user.type(screen.getByLabelText(/price/i), "50");
    await user.click(screen.getByRole("button", { name: /create reward/i }));

    await waitFor(() => {
      expect(createRewardMock).toHaveBeenCalledWith(
        { name: "Ice Cream", description: "A scoop", price: 50 },
        expect.anything(),
      );
    });
  });

  it("admin edits a reward", async () => {
    const user = userEvent.setup();
    vi.mocked(getRewardsMock).mockResolvedValue([
      { id: 1, name: "Ice Cream", description: "A scoop", price: 50 },
    ]);
    vi.mocked(updateRewardMock).mockResolvedValue({
      id: 1, name: "Gelato", description: "A scoop", price: 50,
    });

    renderRewardsPage();

    const editBtn = await screen.findByRole("button", { name: /edit/i });
    await user.click(editBtn);

    const nameInput = screen.getByDisplayValue("Ice Cream");
    await user.clear(nameInput);
    await user.type(nameInput, "Gelato");
    await user.click(screen.getByRole("button", { name: /save/i }));

    await waitFor(() => {
      expect(updateRewardMock).toHaveBeenCalledWith(
        1,
        { name: "Gelato", description: "A scoop", price: 50 },
      );
    });
  });

  it("admin deletes a reward", async () => {
    const user = userEvent.setup();
    vi.mocked(getRewardsMock).mockResolvedValue([
      { id: 1, name: "Ice Cream", description: "A scoop", price: 50 },
    ]);
    vi.mocked(deleteRewardMock).mockResolvedValue(undefined);

    renderRewardsPage();

    const deleteBtn = await screen.findByRole("button", { name: /delete/i });
    await user.click(deleteBtn);

    await waitFor(() => {
      expect(deleteRewardMock).toHaveBeenCalledWith(1, expect.anything());
      // expect.anything() matches the mutation context passed by TanStack Query
    });
  });
});
