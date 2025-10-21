import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

const statusMessages = {
  loading: "Đang hoàn tất đăng nhập...",
  success: "Đăng nhập thành công! Đang chuyển hướng...",
  error: "Không thể hoàn tất đăng nhập. Vui lòng thử lại.",
};

type StatusState = keyof typeof statusMessages;

const SocialCallbackPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { completeSocialLogin } = useAuth();
  const [status, setStatus] = useState<StatusState>("loading");
  const [message, setMessage] = useState(statusMessages.loading);
  const timersRef = useRef<number[]>([]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get("token");
    const error = params.get("error");

    const scheduleRedirect = (path: string, delay: number) => {
      const timeoutId = window.setTimeout(
        () => navigate(path, { replace: true }),
        delay
      );
      timersRef.current.push(timeoutId);
      return timeoutId;
    };

    if (error) {
      setStatus("error");
      setMessage(error);
      const timerId = scheduleRedirect("/login", 3000);
      return () => {
        window.clearTimeout(timerId);
        timersRef.current = timersRef.current.filter((id) => id !== timerId);
      };
    }

    if (!token) {
      setStatus("error");
      setMessage("Thiếu mã xác thực. Vui lòng thử đăng nhập lại.");
      const timerId = scheduleRedirect("/login", 3000);
      return () => {
        window.clearTimeout(timerId);
        timersRef.current = timersRef.current.filter((id) => id !== timerId);
      };
    }

    let cancelled = false;
    completeSocialLogin(token)
      .then((user) => {
        if (cancelled) return;
        setStatus("success");
        setMessage(`Xin chào ${user.full_name}!`);
        scheduleRedirect("/dashboard/profile", 1500);
      })
      .catch((err: Error) => {
        if (cancelled) return;
        setStatus("error");
        setMessage(err.message ?? statusMessages.error);
        scheduleRedirect("/login", 3000);
      });

    return () => {
      cancelled = true;
      timersRef.current.forEach((id) => window.clearTimeout(id));
      timersRef.current = [];
    };
  }, [completeSocialLogin, location.search, navigate]);

  return (
    <div
      style={{
        minHeight: "60vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        gap: "12px",
      }}
    >
      <div className={`status-indicator status-indicator--${status}`}>
        <div
          style={{
            width: "48px",
            height: "48px",
            borderRadius: "50%",
            border: "4px solid #3498db",
            borderTopColor: status === "error" ? "#e74c3c" : "#2ecc71",
            animation:
              status === "loading" ? "spin 1s linear infinite" : "none",
          }}
        />
      </div>
      <h2>{message}</h2>
      {status === "loading" && <p>Vui lòng đợi trong giây lát...</p>}
      <style>
        {`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
};

export default SocialCallbackPage;
