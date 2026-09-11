import api from "./api";
import type { User } from "../types";

export async function login(email: string, password: string): Promise<User> {
  const { data } = await api.get<User[]>("/users", { params: { email } });
  const user = data.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (!user) {
    throw new Error("No account found with this email");
  }
  if (user.password !== password) {
    throw new Error("Incorrect password");
  }
  return user;
}
