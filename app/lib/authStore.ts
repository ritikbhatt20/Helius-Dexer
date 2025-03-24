import { create } from "zustand";

interface AuthState {
  token: string | null;
  isLoading: boolean;
  setToken: (token: string | null) => void;
  checkToken: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  isLoading: true,
  setToken: (token: string | null) => {
    if (typeof window !== "undefined") {
      if (token) {
        localStorage.setItem("token", token);
      } else {
        localStorage.removeItem("token");
      }
    }
    set({ token, isLoading: false });
  },
  checkToken: () => {
    if (typeof window !== "undefined") {
      const storedToken = localStorage.getItem("token");
      set({ token: storedToken, isLoading: false });
    } else {
      set({ isLoading: true });
    }
  },
}));
