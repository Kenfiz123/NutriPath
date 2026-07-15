import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LanguageProvider, useLanguage } from "../app/language";

function LanguageProbe() {
  const { language, locale, t, toggleLanguage } = useLanguage();
  return (
    <div>
      <span>{language}</span>
      <span>{locale}</span>
      <span>{t("Theo Dõi")}</span>
      <button type="button" onClick={toggleLanguage}>toggle</button>
    </div>
  );
}

describe("LanguageProvider", () => {
  beforeEach(() => {
    vi.mocked(window.localStorage.getItem).mockReturnValue(null);
    document.documentElement.lang = "vi";
  });

  it("defaults to Vietnamese and persists English after toggling", async () => {
    const user = userEvent.setup();
    render(<LanguageProvider><LanguageProbe /></LanguageProvider>);

    expect(screen.getByText("vi")).toBeInTheDocument();
    expect(screen.getByText("Theo Dõi")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "toggle" }));

    expect(screen.getByText("en")).toBeInTheDocument();
    expect(screen.getByText("en-US")).toBeInTheDocument();
    expect(screen.getByText("Tracker")).toBeInTheDocument();
    expect(window.localStorage.setItem).toHaveBeenCalledWith("nutripath_language", "en");
    expect(document.documentElement.lang).toBe("en");
  });

  it("restores the saved language on mount", () => {
    vi.mocked(window.localStorage.getItem).mockReturnValue("en");
    render(<LanguageProvider><LanguageProbe /></LanguageProvider>);

    expect(screen.getByText("en-US")).toBeInTheDocument();
    expect(screen.getByText("Tracker")).toBeInTheDocument();
  });
});
