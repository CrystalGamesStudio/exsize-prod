import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route, useLocation } from "react-router-dom";
import { describe, it, expect } from "vitest";
import ParentBottomTabBar from "@/components/ParentBottomTabBar";

function LocationDisplay() {
  return <div data-testid="location">{useLocation().pathname}</div>;
}

function renderBottomBar(initialPath = "/dashboard") {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <ParentBottomTabBar />
    </MemoryRouter>,
  );
}

describe("ParentBottomTabBar", () => {
  it("renders three tabs: Dashboard, add-task, ExBucks", () => {
    renderBottomBar();

    expect(screen.getByLabelText("Dashboard")).toBeInTheDocument();
    expect(screen.getByLabelText("Add task")).toBeInTheDocument();
    expect(screen.getByLabelText("ExBucks")).toBeInTheDocument();
  });

  it("add-task button is visually larger than other tabs", () => {
    renderBottomBar();

    const addBtn = screen.getByLabelText("Add task");
    const dashBtn = screen.getByLabelText("Dashboard");

    expect(addBtn.className).toContain("prominent-tab");
    expect(dashBtn.className).not.toContain("prominent-tab");
  });

  it("highlights the active tab based on current route", () => {
    render(
      <MemoryRouter initialEntries={["/exbucks"]}>
        <Routes>
          <Route path="*" element={<ParentBottomTabBar />} />
        </Routes>
      </MemoryRouter>,
    );

    const exbucksTab = screen.getByLabelText("ExBucks");
    const dashTab = screen.getByLabelText("Dashboard");

    expect(exbucksTab.getAttribute("aria-current")).toBe("page");
    expect(dashTab.getAttribute("aria-current")).toBeNull();
  });

  it("navigates to correct page when tab is clicked", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={["/dashboard"]}>
        <Routes>
          <Route path="*" element={<><ParentBottomTabBar /><LocationDisplay /></>} />
        </Routes>
      </MemoryRouter>,
    );

    await user.click(screen.getByLabelText("ExBucks"));
    expect(screen.getByTestId("location")).toHaveTextContent("/exbucks");
  });

  it("has fixed positioning at bottom of viewport", () => {
    renderBottomBar();

    const nav = screen.getByRole("navigation");
    expect(nav.className).toContain("fixed");
    expect(nav.className).toContain("bottom-0");
  });

  it("is hidden on desktop via md:hidden", () => {
    renderBottomBar();

    const nav = screen.getByRole("navigation");
    expect(nav.className).toContain("md:hidden");
  });
});
