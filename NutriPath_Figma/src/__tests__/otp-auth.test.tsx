import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router";

const mocks = vi.hoisted(() => ({
  requestAuthOtp: vi.fn(),
  verifyAuthOtp: vi.fn(),
  resetPassword: vi.fn(),
}));

vi.mock("../app/api", () => ({
  requestAuthOtp: mocks.requestAuthOtp,
  verifyAuthOtp: mocks.verifyAuthOtp,
  resetPassword: mocks.resetPassword,
}));

import { LanguageProvider } from "../app/language";
import { OtpVerificationForm } from "../app/components/OtpVerificationForm";
import { ForgotPassword } from "../app/pages/ForgotPassword";

function renderWithProviders(children: ReactNode) {
  return render(
    <LanguageProvider>
      <MemoryRouter>{children}</MemoryRouter>
    </LanguageProvider>,
  );
}

describe("email OTP authentication", () => {
  beforeEach(() => {
    mocks.requestAuthOtp.mockResolvedValue({
      sent: true,
      expiresInSeconds: 600,
      retryAfterSeconds: 60,
      message: "sent",
    });
    mocks.verifyAuthOtp.mockResolvedValue({
      verified: true,
      verificationTicket: "verified-ticket",
      expiresAt: new Date(Date.now() + 600_000).toISOString(),
    });
    mocks.resetPassword.mockResolvedValue({ reset: true, message: "updated" });
  });

  it("verifies an eight-digit code before completing registration", async () => {
    const user = userEvent.setup();
    const onVerified = vi.fn();
    renderWithProviders(
      <OtpVerificationForm
        email="member@example.com"
        purpose="register"
        actionLabel="Xác minh và tạo tài khoản"
        onBack={vi.fn()}
        onVerified={onVerified}
      />,
    );

    await user.type(screen.getByLabelText("Mã OTP"), "34196799");
    await user.click(screen.getByRole("button", { name: "Xác minh và tạo tài khoản" }));

    await waitFor(() => {
      expect(mocks.verifyAuthOtp).toHaveBeenCalledWith("member@example.com", "register", "34196799");
      expect(onVerified).toHaveBeenCalledWith("verified-ticket");
    });
  });

  it("completes the forgot-password flow with an OTP ticket", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ForgotPassword />);

    await user.type(screen.getByPlaceholderText("ban@email.com"), "member@example.com");
    await user.click(screen.getByRole("button", { name: "Gửi mã OTP" }));
    expect(mocks.requestAuthOtp).toHaveBeenCalledWith("member@example.com", "password-reset");

    await user.type(await screen.findByLabelText("Mã OTP"), "123456");
    await user.click(screen.getByRole("button", { name: "Xác minh mã OTP" }));

    const passwordFields = await screen.findAllByDisplayValue("");
    const passwordInputs = passwordFields.filter((element) => element.getAttribute("type") === "password");
    await user.type(passwordInputs[0], "NewPass123!");
    await user.type(passwordInputs[1], "NewPass123!");
    await user.click(screen.getByRole("button", { name: "Đặt lại mật khẩu" }));

    await waitFor(() => {
      expect(mocks.resetPassword).toHaveBeenCalledWith("member@example.com", "NewPass123!", "verified-ticket");
      expect(screen.getByText("Đổi mật khẩu thành công")).toBeInTheDocument();
    });
  });
});
