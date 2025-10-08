// src/components/common/SimpleGoogleLogin/SimpleGoogleLogin.tsx
import { useEffect } from "react";

const SimpleGoogleLogin: React.FC = () => {
  useEffect(() => {
    // Load Google Identity Services script
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = initializeGoogle;
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
  }, []);

  const initializeGoogle = () => {
    if (window.google) {
      window.google.accounts.id.initialize({
        client_id:
          "735246521371-86m3r2fqfbj4m7n9n9pojska4943m8vv.apps.googleusercontent.com",
        callback: handleGoogleResponse,
      });

      // Render the button
      const buttonDiv = document.getElementById("google-signin-button");
      if (buttonDiv) {
        window.google.accounts.id.renderButton(buttonDiv, {
          theme: "outline",
          size: "large",
          text: "sign_in_with",
          width: "100%",
        });
      }
    }
  };

  const handleGoogleResponse = async (response: any) => {
    console.log("Google response:", response);

    try {
      const result = await fetch("http://localhost:3000/auth/google/callback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          credential: response.credential,
        }),
      });

      const data = await result.json();
      console.log("Backend response:", data);

      if (data.success) {
        alert("Login successful! Token: " + data.data.token);
        localStorage.setItem("token", data.data.token);
        localStorage.setItem("user", JSON.stringify(data.data.user));
      } else {
        alert("Login failed: " + data.message);
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Network error: " + error);
    }
  };

  return (
    <div style={{ margin: "20px 0" }}>
      <div id="google-signin-button"></div>
    </div>
  );
};

export default SimpleGoogleLogin;
