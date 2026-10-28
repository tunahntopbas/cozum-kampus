import { describe, expect, it, vi } from "vitest";
import { homeFor, isAllowedEmail, requiredRole, roleFromClaims } from "./auth";

const D = "ogr.sakarya.edu.tr,sakarya.edu.tr";

describe("isAllowedEmail", () => {
  it("accepts school domains case-insensitively", () => {
    expect(isAllowedEmail("Ali@OGR.sakarya.edu.tr", D)).toBe(true);
    expect(isAllowedEmail("a@sakarya.edu.tr", D)).toBe(true);
  });

  it("rejects other domains", () => {
    expect(isAllowedEmail("a@gmail.com", D)).toBe(false);
  });

  it("rejects lookalike domains", () => {
    expect(isAllowedEmail("a@evilsakarya.edu.tr", D)).toBe(false);
    expect(isAllowedEmail("a@sakarya.edu.tr.evil.com", D)).toBe(false);
  });

  it("rejects malformed input", () => {
    expect(isAllowedEmail("sakarya.edu.tr", D)).toBe(false);
    expect(isAllowedEmail("a@b@sakarya.edu.tr", D)).toBe(false);
    expect(isAllowedEmail("", D)).toBe(false);
  });

  it("tolerates spaces in the domain list and around the email", () => {
    expect(isAllowedEmail(" a@sakarya.edu.tr ", "ogr.sakarya.edu.tr, sakarya.edu.tr")).toBe(true);
  });

  it("rejects everything when no domains are configured", () => {
    expect(isAllowedEmail("a@sakarya.edu.tr", "")).toBe(false);
    vi.stubEnv("NEXT_PUBLIC_ALLOWED_EMAIL_DOMAINS", "");
    expect(isAllowedEmail("a@sakarya.edu.tr")).toBe(false);
    vi.unstubAllEnvs();
  });
});

describe("requiredRole", () => {
  it("restricts admin pages to admin", () => {
    expect(requiredRole("/yonetim")).toEqual(["admin"]);
    expect(requiredRole("/yonetim/birimler")).toEqual(["admin"]);
  });

  it("allows staff pages for staff and admin", () => {
    expect(requiredRole("/personel")).toEqual(["staff", "admin"]);
    expect(requiredRole("/personel/gecmis")).toEqual(["staff", "admin"]);
  });

  it("leaves login and auth callback public", () => {
    expect(requiredRole("/giris")).toBeNull();
    expect(requiredRole("/auth/callback")).toBeNull();
  });

  it("keeps the KVKK notice readable before sign in", () => {
    expect(requiredRole("/kvkk")).toBeNull();
  });

  it("requires any signed in role elsewhere", () => {
    expect(requiredRole("/")).toEqual(["student", "staff", "admin", "security"]);
    expect(requiredRole("/bildir")).toEqual(["student", "staff", "admin", "security"]);
  });

  it("does not treat lookalike prefixes as admin pages", () => {
    expect(requiredRole("/yonetimx")).toEqual(["student", "staff", "admin", "security"]);
  });
});

describe("homeFor", () => {
  it("sends each role to its own start page", () => {
    expect(homeFor("staff")).toBe("/personel");
    expect(homeFor("admin")).toBe("/yonetim");
    expect(homeFor("student")).toBe("/");
    expect(homeFor("security")).toBe("/");
  });
});

describe("roleFromClaims", () => {
  it("reads the role the database copies into app_metadata", () => {
    expect(roleFromClaims({ app_metadata: { role: "admin" } })).toBe("admin");
    expect(roleFromClaims({ app_metadata: { role: "staff" } })).toBe("staff");
  });
  it("returns null when the token predates the claim or carries junk", () => {
    expect(roleFromClaims({})).toBeNull();
    expect(roleFromClaims({ app_metadata: { role: "root" } })).toBeNull();
    expect(roleFromClaims(null)).toBeNull();
  });
});
