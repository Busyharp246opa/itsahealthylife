import type { Database } from "./database.types";

type ProfileRole = Database["public"]["Enums"]["profile_role"];

const operatorRoles: readonly ProfileRole[] = [
  "super_admin",
  "support",
  "moderator",
  "finance_admin",
  "catalog_admin",
];

export function isOperatorRole(role: ProfileRole | null | undefined) {
  return role != null && operatorRoles.includes(role);
}

export function workspaceHome(role: ProfileRole | null | undefined) {
  if (isOperatorRole(role)) return "/admin";
  if (role === "coachsphere") return "/trainer";
  return "/trainee";
}
