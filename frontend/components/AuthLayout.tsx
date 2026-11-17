import type { ReactNode } from "react";
import Link from "next/link";
import {
  LuArrowUpRight,
  LuCheck,
  LuFileText,
  LuShieldCheck,
} from "react-icons/lu";

export function AuthLayout({
  mode,
  title,
  description,
  children,
}: {
  mode: "login" | "register";
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <main className={"auth-page auth-page-" + mode}>
      <div className="auth-orb auth-orb-one" />
      <div className="auth-orb auth-orb-two" />
      <div className="auth-frame">
        <section className="auth-card">
          <aside className="auth-story">
            <div className="auth-story-content">
              <span className="auth-kicker">
                <i /> INVOICE MANAGEMENT, MADE SIMPLE
              </span>
              <h2>More time for the work that matters.</h2>
              <p>
                Stay on top of every invoice, customer, and payment with one
                clear view of your business.
              </p>
              <div className="auth-preview">
                <div className="auth-preview-head">
                  <span>Monthly overview</span>
                  <span className="auth-preview-period">This month?</span>
                </div>
                <div className="auth-preview-total">
                  <strong>? 84,250</strong>
                  <span>
                    <LuArrowUpRight /> 12.8%
                  </span>
                </div>
                <small>Total collected</small>
                <div className="auth-chart" aria-hidden="true">
                  {[32, 48, 38, 62, 52, 79, 58, 88, 70, 96, 76, 100].map(
                    (height, index) => (
                      <i key={index} style={{ height: height + "%" }} />
                    ),
                  )}
                </div>
                <div className="auth-preview-foot">
                  <span>
                    <i /> Paid invoices
                  </span>
                  <strong>
                    24 <small>this month</small>
                  </strong>
                </div>
              </div>
              <div className="auth-promise">
                <span>
                  <LuCheck />
                </span>
                <div>
                  <strong>Everything in one place</strong>
                  <small>Simple tools for healthier cash flow.</small>
                </div>
              </div>
            </div>
            <div className="auth-story-footer">
              BUILT FOR YOUR BUSINESS <span>·</span> DESIGNED FOR CLARITY
            </div>
          </aside>
          <div className="auth-panel">
            <div className="auth-panel-inner">
              <span className="auth-mobile-mark">
                <LuFileText /> InvoiceFlow
              </span>
              <div className="auth-heading">
                <span className="auth-kicker">
                  {mode === "login"
                    ? "YOUR WORKSPACE IS WAITING"
                    : "A BETTER WAY TO BILL"}
                </span>
                <h1>{title}</h1>
                <p>{description}</p>
              </div>
              {children}
              <div className="auth-privacy">
                <LuShieldCheck /> Your information is encrypted and always kept
                private.
              </div>
            </div>
          </div>
        </section>
        <footer className="auth-footer">
          <span>© {new Date().getFullYear()} InvoiceFlow</span>
          <span>Made for growing businesses</span>
        </footer>
      </div>
    </main>
  );
}
