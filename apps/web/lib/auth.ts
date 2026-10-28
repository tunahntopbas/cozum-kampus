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

// Set by the admin panel switcher so an admin can view the student map instead of bouncing to /yonetim.
export const STUDENT_PANEL_COOKIE = "panel_ogrenci";

function under(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

export function requiredRole(pathname: string): Role[] | null {
  if (under(pathname, "/giris") || under(pathname, "/auth") || under(pathname, "/kvkk")) return null;
  if (under(pathname, "/yonetim")) return ["admin"];
  if (under(pathname, "/personel")) return ["staff", "admin"];
  return ALL_ROLES;
}

// Staff and admin have their own shells; the student map at "/" is not their home.
export function homeFor(role: Role): string {
  if (role === "staff") return "/personel";
  if (role === "admin") return "/yonetim";
  return "/";
}

/** Role carried in the JWT (synced from profiles.role); null when absent so callers fall back to the database. */
export function roleFromClaims(claims: { app_metadata?: object } | null | undefined): Role | null {
  const role = (claims?.app_metadata as { role?: unknown } | undefined)?.role;
  return ALL_ROLES.includes(role as Role) ? (role as Role) : null;
}
