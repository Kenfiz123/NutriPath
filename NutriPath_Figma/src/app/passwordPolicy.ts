export type PasswordValidation = {
  valid: boolean;
  message: string;
};

export function validatePasswordStrength(password: string): PasswordValidation {
  if (password.length < 8) {
    return { valid: false, message: "Mật khẩu cần ít nhất 8 ký tự." };
  }
  if (password.length > 128) {
    return { valid: false, message: "Mật khẩu không được quá 128 ký tự." };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: "Mật khẩu cần ít nhất 1 chữ hoa (A-Z)." };
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, message: "Mật khẩu cần ít nhất 1 chữ thường (a-z)." };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, message: "Mật khẩu cần ít nhất 1 số (0-9)." };
  }
  if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
    return { valid: false, message: "Mật khẩu cần ít nhất 1 ký tự đặc biệt (!@#$%^&*...)." };
  }

  const weakPatterns = [
    /^123/,
    /abc/i,
    /qwerty/i,
    /111/,
    /222/,
    /333/,
    /444/,
    /555/,
    /666/,
    /777/,
    /888/,
    /999/,
    /000/,
    /1234/,
    /2345/,
    /3456/,
    /4567/,
    /5678/,
    /6789/,
    /7890/,
  ];
  if (weakPatterns.some((pattern) => pattern.test(password))) {
    return {
      valid: false,
      message: "Mật khẩu quá yếu. Tránh dùng các mẫu đơn giản như 123456, abc123.",
    };
  }

  return { valid: true, message: "" };
}
