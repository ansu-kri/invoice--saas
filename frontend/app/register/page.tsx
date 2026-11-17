"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  LuArrowRight,
  LuBuilding2,
  LuEye,
  LuEyeOff,
  LuKeyRound,
  LuMail,
  LuUserRound,
} from "react-icons/lu";
import { toast } from "sonner";
import { AuthLayout } from "@/components/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { registerUser } from "@/services/authServices";

function passwordScore(value: string) {
  return [
    value.length >= 8,
    /[A-Z]/.test(value),
    /[a-z]/.test(value),
    /\d/.test(value),
    /[^A-Za-z0-9]/.test(value),
  ].filter(Boolean).length;
}
export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [organizationName, setOrganizationName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const score = passwordScore(password);
  const strength = score < 2 ? "Weak" : score < 4 ? "Fair" : "Strong";
  const handleRegister = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError("");
    if (password.length < 6) {
      setFormError("Choose a password with at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setFormError("Your passwords don’t match. Please check and try again.");
      return;
    }
    if (!acceptedTerms) {
      setFormError("Please agree to the terms to create your account.");
      return;
    }
    setSubmitting(true);
    try {
      const data = await registerUser({
        name: name.trim(),
        email: email.trim(),
        password,
        organizationName: organizationName.trim(),
      });
      if (!data.token)
        throw new Error("We couldn’t create your account. Please try again.");
      localStorage.setItem("token", data.token);
      if (data.user) localStorage.setItem("user", JSON.stringify(data.user));
      window.dispatchEvent(new Event("invoice-auth-change"));
      toast.success("Your account is ready!");
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
      mode="register"
      title="Start with clarity"
      description="Bring your invoices, customers, and payments together in one calm, organized workspace."
    >
      <form className="auth-form auth-form-register" onSubmit={handleRegister}>
        <div className="auth-field">
          <label htmlFor="register-name">Full name</label>
          <div className="auth-input-wrap">
            <LuUserRound />
            <Input
              id="register-name"
              type="text"
              autoComplete="name"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              maxLength={100}
            />
          </div>
        </div>
        <div className="auth-field">
          <label htmlFor="register-org">Business name</label>
          <div className="auth-input-wrap">
            <LuBuilding2 />
            <Input
              id="register-org"
              type="text"
              autoComplete="organization"
              placeholder="Your company or business"
              value={organizationName}
              onChange={(e) => setOrganizationName(e.target.value)}
              required
              maxLength={120}
            />
          </div>
        </div>
        <div className="auth-field">
          <label htmlFor="register-email">Work email</label>
          <div className="auth-input-wrap">
            <LuMail />
            <Input
              id="register-email"
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
          <label htmlFor="register-password">Password</label>
          <div className="auth-input-wrap">
            <LuKeyRound />
            <Input
              id="register-password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="At least 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
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
          {password && (
            <div className="auth-strength" aria-live="polite">
              <div className="auth-strength-bars">
                {[1, 2, 3, 4].map((bar) => (
                  <span
                    key={bar}
                    className={
                      score >= bar + 1 ? "is-" + strength.toLowerCase() : ""
                    }
                  />
                ))}
              </div>
              <span>
                Password strength: <strong>{strength}</strong>
              </span>
            </div>
          )}
        </div>
        <div className="auth-field">
          <label htmlFor="register-confirm">Confirm password</label>
          <div className="auth-input-wrap">
            <LuKeyRound />
            <Input
              id="register-confirm"
              type={showConfirm ? "text" : "password"}
              autoComplete="new-password"
              placeholder="Re-enter your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
            <button
              className="auth-visibility"
              type="button"
              aria-label={showConfirm ? "Hide password" : "Show password"}
              onClick={() => setShowConfirm(!showConfirm)}
            >
              {showConfirm ? <LuEyeOff /> : <LuEye />}
            </button>
          </div>
        </div>
        <label className="auth-checkbox auth-terms">
          <input
            type="checkbox"
            checked={acceptedTerms}
            onChange={(e) => setAcceptedTerms(e.target.checked)}
          />
          <span>I agree to the Terms and Conditions and Privacy Policy.</span>
        </label>
        {formError && (
          <p className="auth-error" role="alert">
            {formError}
          </p>
        )}
        <Button type="submit" disabled={submitting} className="auth-submit">
          {submitting ? (
            <>
              <span className="auth-spinner" /> Creating account…
            </>
          ) : (
            <>
              Create account <LuArrowRight />
            </>
          )}
        </Button>
        <p className="auth-switch">
          Already have an account? <Link href="/login">Sign in</Link>
        </p>
      </form>
    </AuthLayout>
  );
}
