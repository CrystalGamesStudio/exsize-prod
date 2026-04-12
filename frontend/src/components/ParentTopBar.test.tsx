import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect } from "vitest";
import ParentTopBar from "@/components/ParentTopBar";

function renderTopBar() {
  return render(
    <MemoryRouter initialEntries={["/dashboard"]}>
      <ParentTopBar />
    </MemoryRouter>,
  );
}

describe("ParentTopBar", () => {
  it("renders Settings icon, Family link, and SizePass button", () => {
    renderTopBar();

    expect(screen.getByLabelText("Settings")).toBeInTheDocument();
    expect(screen.getByLabelText("Family")).toBeInTheDocument();
    expect(screen.getByLabelText("SizePass")).toBeInTheDocument();
  });

  it("Settings links to /settings", () => {
    renderTopBar();

    const settingsLink = screen.getByLabelText("Settings");
    expect(settingsLink).toHaveAttribute("href", "/settings");
  });

  it("Family links to /family", () => {
    renderTopBar();

    const familyLink = screen.getByLabelText("Family");
    expect(familyLink).toHaveAttribute("href", "/family");
  });
});
