import type { Metadata } from "next";
import { SignInForm } from "./sign-in-form";

export const metadata: Metadata = { title: "Researcher sign in · Portainer UI Concept Test", robots: { index: false } };

export default function AdminLoginPage() {
  return (
    <main className="grid min-h-dvh place-items-center bg-linear-to-b from-brand-soft/60 to-background px-4 py-10">
      <SignInForm />
    </main>
  );
}
