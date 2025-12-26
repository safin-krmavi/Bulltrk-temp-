// import apiClient from "@/api/apiClient";
import { loginUser, registerUser } from "@/api/auth";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/authstore";

export function useAuth() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { setToken, setUser, logout: storeLogout } = useAuthStore();

  const setAuthData = (token: string, user: any) => {
    localStorage.setItem("AUTH_TOKEN", token);
    localStorage.setItem("user", JSON.stringify(user));
    // Update Zustand store
    setToken(token);
    setUser(user);
  };

  const clearAuthData = () => {
    localStorage.removeItem("AUTH_TOKEN");
    localStorage.removeItem("user");
    // Clear Zustand store
    storeLogout();
  };

  const login = useMutation({
    mutationFn: async (payload: { email: string; password: string }) =>
      loginUser(payload.email, payload.password),
    onSuccess: (response) => {
      const token = response.data.token;
      const user = response.data.user;

      if (!token) {
        toast.error("Login response missing token");
        return;
      }

      setAuthData(token, user);
      toast.success("Login successful");
      navigate("/dashboard");
      queryClient.invalidateQueries({ queryKey: ["userProfile"] });
    },
    onError: (error: any) => {
      const serverMsg =
        error?.response?.data?.message ??
        error?.message ??
        "Login failed";
      toast.error(serverMsg);
    }
  });

  const register = useMutation({
    mutationFn: async (payload: any) => registerUser(payload),
    onSuccess: (response) => {
      const msg =
        response?.data?.message ||
        response?.message ||
        "Registration successful";
      toast.success(msg);
      navigate("/login");
    },
    onError: (error: any) => {
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        "Registration failed";
      toast.error(errorMessage);
    }
  });

  const logout = () => {
    clearAuthData();
    queryClient.removeQueries();
    navigate("/login");
    toast.success("Logged out successfully");
  };

  return { login, register, logout };
}