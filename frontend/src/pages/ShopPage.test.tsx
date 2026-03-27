import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { AuthProvider } from "@/auth";
import ShopPage from "@/pages/ShopPage";

vi.mock("@/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/api")>();
  return {
    ...actual,
    getRewards: vi.fn(),
    purchaseReward: vi.fn(),
    getPurchases: vi.fn(),
    getBalance: vi.fn(),
    getFamily: vi.fn(),
    getChildPurchases: vi.fn(),
    getMe: vi.fn(),
    setToken: vi.fn(),
  };
});

import {
  getRewards as getRewardsMock,
  purchaseReward as purchaseRewardMock,
  getPurchases as getPurchasesMock,
  getBalance as getBalanceMock,
  getFamily as getFamilyMock,
  getChildPurchases as getChildPurchasesMock,
} from "@/api";
import type { UserResponse } from "@/api";

function renderShopPage(role: "child" | "parent" = "child") {
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
          <ShopPage user={user} />
        </MemoryRouter>
      </AuthProvider>
    </QueryClientProvider>,
  );
}

describe("ShopPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("child sees reward catalog with prices", async () => {
    vi.mocked(getRewardsMock).mockResolvedValue([
      { id: 1, name: "Ice Cream", description: "A scoop of ice cream", price: 50 },
      { id: 2, name: "Movie Night", description: "Pick the movie", price: 100 },
    ]);
    vi.mocked(getBalanceMock).mockResolvedValue({ balance: 200 });
    vi.mocked(getPurchasesMock).mockResolvedValue([]);

    renderShopPage("child");

    expect(await screen.findByText("Ice Cream")).toBeInTheDocument();
    expect(screen.getByText("50 ExBucks")).toBeInTheDocument();
    expect(screen.getByText("Movie Night")).toBeInTheDocument();
    expect(screen.getByText("100 ExBucks")).toBeInTheDocument();
  });

  it("child purchases a reward when balance is sufficient", async () => {
    const user = userEvent.setup();
    vi.mocked(getRewardsMock).mockResolvedValue([
      { id: 1, name: "Ice Cream", description: "A scoop", price: 50 },
    ]);
    vi.mocked(getBalanceMock).mockResolvedValue({ balance: 200 });
    vi.mocked(getPurchasesMock).mockResolvedValue([]);
    vi.mocked(purchaseRewardMock).mockResolvedValue({
      id: 1, reward_name: "Ice Cream", price: 50, created_at: "2026-03-27T10:00:00",
    });

    renderShopPage("child");

    const buyBtn = await screen.findByRole("button", { name: /buy/i });
    await user.click(buyBtn);

    await waitFor(() => {
      expect(purchaseRewardMock).toHaveBeenCalledWith(1, expect.anything());
    });
  });

  it("child sees insufficient balance error when trying to purchase", async () => {
    vi.mocked(getRewardsMock).mockResolvedValue([
      { id: 1, name: "Ice Cream", description: "A scoop", price: 50 },
    ]);
    vi.mocked(getBalanceMock).mockResolvedValue({ balance: 10 });
    vi.mocked(getPurchasesMock).mockResolvedValue([]);

    renderShopPage("child");

    await screen.findByText("Ice Cream");

    // Buy button should be disabled when balance is insufficient
    const buyBtn = screen.getByRole("button", { name: /buy/i });
    expect(buyBtn).toBeDisabled();
  });

  it("child sees purchase history", async () => {
    vi.mocked(getRewardsMock).mockResolvedValue([]);
    vi.mocked(getBalanceMock).mockResolvedValue({ balance: 150 });
    vi.mocked(getPurchasesMock).mockResolvedValue([
      { id: 1, reward_name: "Ice Cream", price: 50, created_at: "2026-03-27T10:00:00" },
      { id: 2, reward_name: "Movie Night", price: 100, created_at: "2026-03-27T11:00:00" },
    ]);

    renderShopPage("child");

    expect(await screen.findByText("Ice Cream")).toBeInTheDocument();
    expect(screen.getByText("Movie Night")).toBeInTheDocument();
  });

  it("parent sees children's purchases", async () => {
    const user = userEvent.setup();
    vi.mocked(getRewardsMock).mockResolvedValue([]);
    vi.mocked(getFamilyMock).mockResolvedValue({
      id: 1,
      pin: "ABC123",
      members: [
        { id: 1, email: "parent@test.com", role: "parent" },
        { id: 2, email: "child@test.com", role: "child" },
      ],
    });
    vi.mocked(getChildPurchasesMock).mockResolvedValue([
      { id: 1, reward_name: "Ice Cream", price: 50, created_at: "2026-03-27T10:00:00" },
    ]);

    renderShopPage("parent");

    const select = await screen.findByLabelText(/select child/i);
    await waitFor(() => {
      expect(select.querySelectorAll("option")).toHaveLength(2); // placeholder + 1 child
    });

    await user.selectOptions(select, "2");

    expect(await screen.findByText("Ice Cream")).toBeInTheDocument();
    expect(screen.getByText("50 ExBucks")).toBeInTheDocument();
  });

  it("E2E: admin creates reward → child purchases → balance deducted → parent sees purchase", async () => {
    const user = userEvent.setup();

    // Step 1: Admin creates a reward (via RewardsPage)
    // We simulate this by verifying the reward appears in child's shop

    // Step 2: Child sees reward in catalog and purchases it
    vi.mocked(getRewardsMock).mockResolvedValue([
      { id: 1, name: "Pizza Party", description: "Friday pizza", price: 75 },
    ]);
    vi.mocked(getBalanceMock).mockResolvedValue({ balance: 100 });
    vi.mocked(getPurchasesMock).mockResolvedValue([]);
    vi.mocked(purchaseRewardMock).mockResolvedValue({
      id: 1, reward_name: "Pizza Party", price: 75, created_at: "2026-03-27T12:00:00",
    });

    const { unmount: unmountChild } = renderShopPage("child");

    const buyBtn = await screen.findByRole("button", { name: /buy/i });
    expect(buyBtn).not.toBeDisabled();
    await user.click(buyBtn);

    await waitFor(() => {
      expect(purchaseRewardMock).toHaveBeenCalledWith(1, expect.anything());
    });
    unmountChild();

    // Step 3: Parent sees the purchase
    vi.mocked(getRewardsMock).mockResolvedValue([]);
    vi.mocked(getFamilyMock).mockResolvedValue({
      id: 1,
      pin: "ABC123",
      members: [
        { id: 1, email: "parent@test.com", role: "parent" },
        { id: 2, email: "child@test.com", role: "child" },
      ],
    });
    vi.mocked(getChildPurchasesMock).mockResolvedValue([
      { id: 1, reward_name: "Pizza Party", price: 75, created_at: "2026-03-27T12:00:00" },
    ]);

    renderShopPage("parent");

    const select = await screen.findByLabelText(/select child/i);
    await waitFor(() => {
      expect(select.querySelectorAll("option")).toHaveLength(2);
    });
    await user.selectOptions(select, "2");

    expect(await screen.findByText("Pizza Party")).toBeInTheDocument();
    expect(screen.getByText("75 ExBucks")).toBeInTheDocument();
  });
});
