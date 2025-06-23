import type { User } from "./db";

export type APIUser = Omit<User, "password">