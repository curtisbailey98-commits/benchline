import type { Metadata } from "next";
import { LoginForm } from "@/components/LoginForm";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  const configured =
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  return (
    <div className="container-page py-14">
      <h1 className="mb-2 text-center text-3xl font-semibold">Sign in</h1>
      <p className="mb-8 text-center text-sm text-muted">
        Magic link or email/password via Supabase Auth.
      </p>
      {configured ? (
        <LoginForm />
      ) : (
        <div className="card mx-auto max-w-md text-sm text-muted">
          Configure Supabase env vars to enable authentication.
        </div>
      )}
    </div>
  );
}
