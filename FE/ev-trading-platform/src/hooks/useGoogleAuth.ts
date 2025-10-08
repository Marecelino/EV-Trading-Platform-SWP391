// src/hooks/useGoogleAuth.ts
import { useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";

declare global {
  interface Window {
    google: {
      accounts: {
        id: {
          initialize: (config: GoogleConfig) => void;
          renderButton: (
            parent: HTMLElement | null,
            options: GoogleButtonConfig
          ) => void;
          prompt: () => void;
        };
      };
    };
  }
}

interface GoogleConfig {
  client_id: string;
  callback: (response: GoogleCredentialResponse) => void;
}

interface GoogleButtonConfig {
  theme?: "outline" | "filled_blue" | "filled_black";
  size?: "large" | "medium" | "small";
  text?: "sign_in_with" | "sign_up_with" | "continue_with" | "sign_in";
  shape?: "rectangular" | "pill" | "circle" | "square";
  logo_alignment?: "left" | "center";
  width?: string;
}

interface GoogleCredentialResponse {
  credential: string;
  select_by: string;
}

const GOOGLE_CLIENT_ID =
  import.meta.env.VITE_GOOGLE_CLIENT_ID || "your_google_client_id_here";

export const useGoogleAuth = () => {
  const { googleLogin, isLoading } = useAuth();
  const navigate = useNavigate();

  // Debug log
  console.log("Google Client ID:", GOOGLE_CLIENT_ID);

  useEffect(() => {
    const loadGoogleScript = () => {
      if (window.google) {
        initializeGoogleAuth();
        return;
      }

      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.onload = initializeGoogleAuth;
      document.head.appendChild(script);
    };

    const initializeGoogleAuth = () => {
      if (window.google) {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleGoogleResponse,
        });
      }
    };

    const handleGoogleResponse = async (response: GoogleCredentialResponse) => {
      try {
        const user = await googleLogin(response.credential);
        if (user.role === "admin") {
          navigate("/admin/dashboard");
        } else {
          navigate("/");
        }
      } catch (error) {
        console.error("Google login failed:", error);
      }
    };

    loadGoogleScript();
  }, [googleLogin, navigate]);

  const renderGoogleButton = (
    elementId: string,
    options?: GoogleButtonConfig
  ) => {
    const element = document.getElementById(elementId);
    if (element && window.google) {
      window.google.accounts.id.renderButton(element, {
        theme: "outline",
        size: "large",
        text: "sign_in_with",
        shape: "rectangular",
        logo_alignment: "left",
        width: "100%",
        ...options,
      });
    }
  };

  return {
    renderGoogleButton,
    isLoading,
  };
};
