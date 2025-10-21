import {
  createContext,
  useState,
  useContext,
  useEffect,
  useCallback,
} from "react";
import type { ReactNode } from "react";
import authApi from "../api/authApi";
import userApi from "../api/userApi";
import type { User } from "../types";

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<User>;
  logout: () => void;
  isLoading: boolean;
  register: (
    fullName: string,
    email: string,
    password: string
  ) => Promise<User>;
  completeSocialLogin: (token: string) => Promise<User>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const allowedRoles: User["role"][] = ["member", "admin", "user"];
const allowedStatuses: User["status"][] = [
  "active",
  "suspended",
  "inactive",
  "banned",
];

const normalizeUser = (data: any): User => {
  const email: string = data?.email ?? "";
  const rawRole = data?.role as User["role"] | undefined;
  const rawStatus = data?.status as User["status"] | undefined;

  const role = rawRole && allowedRoles.includes(rawRole) ? rawRole : "user";
  const status =
    rawStatus && allowedStatuses.includes(rawStatus) ? rawStatus : "active";
  const id: string = data?._id ?? data?.id ?? "";

  return {
    _id: id,
    email,
    full_name:
      data?.full_name ?? data?.name ?? (email ? email.split("@")[0] : ""),
    role,
    avatar_url: data?.avatar_url ?? data?.avatar ?? undefined,
    phone: data?.phone ?? undefined,
    status,
    rating: data?.rating,
    oauthProviders: Array.isArray(data?.oauthProviders)
      ? data.oauthProviders
      : undefined,
  };
};

const pickAuthPayload = (raw: any) => {
  const base = raw?.data ?? raw;
  const nested = base?.data ?? base;

  const userData = nested?.user ?? base?.user ?? raw?.user;
  const token =
    nested?.token ??
    nested?.access_token ??
    base?.token ??
    base?.access_token ??
    raw?.token ??
    raw?.access_token ??
    null;
  const message = raw?.message ?? base?.message ?? nested?.message;

  return { userData, token, message };
};

const resolveErrorMessage = (error: any, fallback: string) =>
  error?.response?.data?.message ?? error?.message ?? fallback;

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem("token")
  );
  const [isLoading, setIsLoading] = useState(false);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("token");
  }, []);

  const fetchAndSetProfile = useCallback(async (): Promise<User> => {
    const response = await userApi.getProfile();
    const payload = response.data?.data ?? response.data;
    if (!payload) {
      throw new Error("Không thể tải thông tin người dùng.");
    }
    const normalized = normalizeUser(payload);
    setUser(normalized);
    return normalized;
  }, []);

  useEffect(() => {
    if (!token) {
      setUser(null);
      return;
    }
    if (user) {
      return;
    }
    let cancelled = false;
    setIsLoading(true);
    fetchAndSetProfile()
      .catch(() => {
        if (!cancelled) {
          logout();
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [token, user, fetchAndSetProfile, logout]);

  const login = useCallback(
    async (email: string, password: string): Promise<User> => {
      setIsLoading(true);
      try {
        const response = await authApi.login(email, password);
        const {
          userData,
          token: newToken,
          message,
        } = pickAuthPayload(response.data);
        if (!userData || !newToken) {
          throw new Error(message ?? "Đăng nhập thất bại");
        }
        const normalized = normalizeUser(userData);
        setUser(normalized);
        setToken(newToken);
        localStorage.setItem("token", newToken);
        return normalized;
      } catch (error: any) {
        throw new Error(resolveErrorMessage(error, "Đăng nhập thất bại"));
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const register = useCallback(
    async (
      fullName: string,
      email: string,
      password: string
    ): Promise<User> => {
      setIsLoading(true);
      try {
        const response = await authApi.register(fullName, email, password);
        const {
          userData,
          token: newToken,
          message,
        } = pickAuthPayload(response.data);
        if (!userData || !newToken) {
          throw new Error(message ?? "Đăng ký thất bại");
        }
        const normalized = normalizeUser(userData);
        setUser(normalized);
        setToken(newToken);
        localStorage.setItem("token", newToken);
        return normalized;
      } catch (error: any) {
        throw new Error(resolveErrorMessage(error, "Đăng ký thất bại"));
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const completeSocialLogin = useCallback(
    async (incomingToken: string): Promise<User> => {
      setIsLoading(true);
      try {
        localStorage.setItem("token", incomingToken);
        setToken(incomingToken);
        const profile = await fetchAndSetProfile();
        return profile;
      } catch (error: any) {
        logout();
        throw new Error(
          resolveErrorMessage(
            error,
            "Không thể đăng nhập bằng tài khoản mạng xã hội. Vui lòng thử lại."
          )
        );
      } finally {
        setIsLoading(false);
      }
    },
    [fetchAndSetProfile, logout]
  );

  const value: AuthContextType = {
    user,
    token,
    login,
    logout,
    isLoading,
    register,
    completeSocialLogin,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
