import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const projectRoot = new URL("../../..", import.meta.url);
const readProjectFile = (relativePath: string) => readFileSync(new URL(relativePath, projectRoot), "utf8");

describe("staged email signup", () => {
  it("uses Supabase email confirmation with a safe browser-origin redirect", () => {
    const page = readProjectFile("client/src/pages/SignUp.tsx");

    expect(page).toContain("auth.signUp");
    expect(page).toContain("emailRedirectTo: window.location.origin");
    expect(page).toContain("MIN_PASSWORD_LENGTH = 12");
    expect(page).toContain("confirmationSent");
    expect(page).toContain('role="alert"');
  });

  it("connects public entry points to the signup route", () => {
    const app = readProjectFile("client/src/App.tsx");
    const home = readProjectFile("client/src/pages/Home.tsx");
    const signIn = readProjectFile("client/src/pages/SignIn.tsx");

    expect(app).toContain('path="/sign-up"');
    expect(home).toContain('user ? "/workspace" : "/sign-up"');
    expect(signIn).toContain('setLocation("/sign-up")');
  });
});
