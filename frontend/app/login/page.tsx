"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  LuArrowRight,
  LuEye,
  LuEyeOff,
  LuKeyRound,
  LuMail,
} from "react-icons/lu";
import { toast } from "sonner";
import { AuthLayout } from "@/components/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { loginUser } from "@/services/authServices";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError("");
    setSubmitting(true);
    try {
      const data = await loginUser({ email: email.trim(), password });
      if (!data.token)
        throw new Error(
          "We couldn’t sign you in. Please check your details and try again.",
        );
      localStorage.setItem("token", data.token);
      if (data.user) localStorage.setItem("user", JSON.stringify(data.user));
      window.dispatchEvent(new Event("invoice-auth-change"));
      toast.success("Welcome back!");
      router.push("/dashboard");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Something went wrong. Please try again.";
      setFormError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };
  return (
    <AuthLayout
      mode="login"
      title="Welcome back"
      description="Sign in to keep your business moving. Your invoices and cash flow are right where you left them."
    >
      <form className="auth-form" onSubmit={handleLogin}>
        <div className="auth-field">
          <label htmlFor="login-email">Email address</label>
          <div className="auth-input-wrap">
            <LuMail />
            <Input
              id="login-email"
              type="email"
              autoComplete="email"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              maxLength={254}
            />
          </div>
        </div>
        <div className="auth-field">
          <div className="auth-label-row">
            <label htmlFor="login-password">Password</label>
            <button
              className="auth-text-link"
              type="button"
              onClick={() =>
                toast(
                  "Please contact your workspace administrator to reset your password.",
                )
              }
            >
              Forgot password?
            </button>
          </div>
          <div className="auth-input-wrap">
            <LuKeyRound />
            <Input
              id="login-password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              className="auth-visibility"
              type="button"
              aria-label={showPassword ? "Hide password" : "Show password"}
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <LuEyeOff /> : <LuEye />}
            </button>
          </div>
        </div>
        <label className="auth-checkbox">
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
          />
          <span>Remember me</span>
        </label>
        {formError && (
          <p className="auth-error" role="alert">
            {formError}
          </p>
        )}
        <Button type="submit" disabled={submitting} className="auth-submit">
          {submitting ? (
            <>
              <span className="auth-spinner" /> Signing in…
            </>
          ) : (
            <>
              Sign in <LuArrowRight />
            </>
          )}
        </Button>
        <p className="auth-switch">
          Don’t have an account? <Link href="/register">Create account</Link>
        </p>
      </form>
    </AuthLayout>
  );
}
