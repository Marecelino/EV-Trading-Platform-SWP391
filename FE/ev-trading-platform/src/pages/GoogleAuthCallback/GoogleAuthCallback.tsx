// src/pages/GoogleAuthCallback/GoogleAuthCallback.tsx
import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

const GoogleAuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const token = searchParams.get("token");
    const userStr = searchParams.get("user");
    const error = searchParams.get("message");

    if (error) {
      // Xử lý lỗi 
      console.error("Google login error:", error);
      navigate("/login?error=" + encodeURIComponent(error));
      return;
    }

    if (token && userStr) {
      try {
        const user = JSON.parse(decodeURIComponent(userStr));

        // Lưu vào localStorage
        localStorage.setItem("token", token);

        // Reload trang để AuthContext có thể đọc token từ localStorage
        window.location.href = user.role === "admin" ? "/admin/dashboard" : "/";
      } catch (err) {
        console.error("Error parsing user data:", err);
        navigate("/login?error=Invalid+response+data");
      }
    } else {
      navigate("/login?error=Missing+authentication+data");
    }
  }, [searchParams, navigate]);

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        flexDirection: "column",
      }}
    >
      <div>Đang xử lý đăng nhập...</div>
      <div style={{ marginTop: "1rem", fontSize: "0.9rem", color: "#666" }}>
        Vui lòng đợi một chút...
      </div>
    </div>
  );
};

export default GoogleAuthCallback;
