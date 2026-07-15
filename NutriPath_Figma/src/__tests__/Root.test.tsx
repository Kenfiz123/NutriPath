import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("react-router", () => ({
  Outlet: () => <main data-testid="outlet" />,
  useLocation: () => ({ pathname: "/dashboard" }),
}));

vi.mock("../app/auth", () => ({
  useAuth: () => ({ session: { member: { id: "member-1" } } }),
}));

vi.mock("../app/components/layout/Navbar", () => ({
  Navbar: () => <nav data-testid="navbar" />,
}));

vi.mock("../app/components/ChatBot", () => ({
  ChatBot: ({ memberId, onClose }: { memberId: string; onClose: () => void }) => (
    <section data-testid="chatbot" data-member-id={memberId}>
      <button type="button" onClick={onClose}>Đóng cửa sổ chat</button>
    </section>
  ),
}));

import { Root } from "../app/components/layout/Root";

describe("Root ChatBot lazy mount", () => {
  it("mounts ChatBot only after the authenticated user opens the FAB", () => {
    render(<Root />);

    expect(screen.queryByTestId("chatbot")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Mở NutriBot" }));
    expect(screen.getByTestId("chatbot")).toHaveAttribute("data-member-id", "member-1");
    expect(screen.getByRole("button", { name: "Đóng NutriBot" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Đóng cửa sổ chat" }));
    expect(screen.queryByTestId("chatbot")).not.toBeInTheDocument();
  });
});
