export type Role = "student" | "staff" | "admin" | "security";

const ALL_ROLES: Role[] = ["student", "staff", "admin", "security"];

export function isAllowedEmail(
  email: string,
  domains: string | undefined = process.env.NEXT_PUBLIC_ALLOWED_EMAIL_DOMAINS,
): boolean {
  const allowed = (domains ?? "")
    .split(",")
    .map((d) => d.trim().toLowerCase())
    .filter(Boolean);
  const parts = email.trim().toLowerCase().split("@");
  if (parts.length !== 2 || !parts[0]) return false;
  return allowed.includes(parts[1]);
}

function under(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

export function requiredRole(pathname: string): Role[] | null {
  if (under(pathname, "/giris") || under(pathname, "/auth")) return null;
  if (under(pathname, "/yonetim")) return ["admin"];
  if (under(pathname, "/personel")) return ["staff", "admin"];
  return ALL_ROLES;
}
