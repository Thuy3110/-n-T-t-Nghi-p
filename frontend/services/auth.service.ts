import api from "./api";
import { LoginPayload, RegisterPayload } from "@/types/auth.type";

export const authService = {
  register(payload: RegisterPayload) {
    return api.post("/auth/register", payload);
  },

  login(payload: LoginPayload) {
    return api.post("/auth/login", payload);
  },

  changePassword(payload: { currentPassword: string; newPassword: string }) {
    return api.post("/auth/change-password", payload);
  },

  resetPassword(payload: { username: string; newPassword: string }) {
    return api.post("/auth/reset-password", payload);
  },
};
