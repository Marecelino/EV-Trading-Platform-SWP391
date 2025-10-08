// src/components/common/GoogleLoginButton/GoogleLoginButton.tsx
import { useEffect, useRef } from "react";
import { useGoogleAuth } from "../../../hooks/useGoogleAuth";
import "./GoogleLoginButton.scss";

interface GoogleLoginButtonProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
  disabled?: boolean;
  theme?: "outline" | "filled_blue" | "filled_black";
  size?: "large" | "medium" | "small";
  text?: "sign_in_with" | "sign_up_with" | "continue_with" | "sign_in";
}

const GoogleLoginButton: React.FC<GoogleLoginButtonProps> = ({
  disabled = false,
  theme = "outline",
  size = "large",
  text = "sign_in_with",
}) => {
  const buttonRef = useRef<HTMLDivElement>(null);
  const { renderGoogleButton, isLoading } = useGoogleAuth();

  useEffect(() => {
    if (!disabled && buttonRef.current) {
      const timer = setTimeout(() => {
        renderGoogleButton("google-signin-button", {
          theme,
          size,
          text,
          shape: "rectangular",
          logo_alignment: "left",
          width: "100%",
        });
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [disabled, renderGoogleButton, theme, size, text]);

  return (
    <div className="google-login-button-container">
      <div
        ref={buttonRef}
        id="google-signin-button"
        className={`google-signin-button ${disabled ? "disabled" : ""}`}
        style={{ opacity: disabled || isLoading ? 0.6 : 1 }}
      />
      {(disabled || isLoading) && (
        <div className="button-overlay">
          {isLoading ? "Đang xử lý..." : "Vô hiệu hóa"}
        </div>
      )}
    </div>
  );
};

export default GoogleLoginButton;
