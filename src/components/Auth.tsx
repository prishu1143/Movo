import { useState } from "react";
import type { FormEvent } from "react";
import { supabase } from "../services/supabase";
import "./Auth.css";

type AuthProps = {
  onAuthenticated: () => void;
};

export default function Auth({ onAuthenticated }: AuthProps) {
  const [mode, setMode] = useState<"login" | "signup">("login");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const resetMessages = () => {
    setMessage("");
    setError("");
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    resetMessages();

    if (!email.trim() || !password) {
      setError("Please enter your email and password.");
      return;
    }

    if (mode === "signup" && !name.trim()) {
      setError("Please enter your name.");
      return;
    }

    if (password.length < 6) {
      setError("Your password must be at least 6 characters.");
      return;
    }

    setLoading(true);

    try {
      if (mode === "signup") {
        const { data, error: signUpError } =
          await supabase.auth.signUp({
            email: email.trim(),
            password,
            options: {
              data: {
                display_name: name.trim(),
              },
            },
          });

        if (signUpError) {
          throw signUpError;
        }

        if (data.session) {
          onAuthenticated();
          return;
        }

        setMessage(
          "Account created. Check your email to confirm your account, then log in."
        );

        setMode("login");
        setPassword("");
      } else {
        const { error: signInError } =
          await supabase.auth.signInWithPassword({
            email: email.trim(),
            password,
          });

        if (signInError) {
          throw signInError;
        }

        onAuthenticated();
      }
    } catch (authError) {
      console.error("Authentication error:", authError);

      setError(
        authError instanceof Error
          ? authError.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const switchMode = () => {
    resetMessages();

    setMode((current) =>
      current === "login" ? "signup" : "login"
    );
  };

  return (
    <div className="auth-screen">
      <div className="auth-orbit" aria-hidden="true">
        <div className="auth-orbit-ring auth-orbit-ring-one" />
        <div className="auth-orbit-ring auth-orbit-ring-two" />

        <div className="auth-orbit-core">
          <span>M</span>
        </div>

        <span className="auth-orbit-dot auth-dot-one" />
        <span className="auth-orbit-dot auth-dot-two" />
        <span className="auth-orbit-dot auth-dot-three" />
      </div>

      <div className="auth-container">
        <div className="auth-brand">
          <div className="auth-brand-mark">M</div>
          <span>Movo</span>
        </div>

        <div className="auth-card">
          <div className="auth-card-header">
            <p className="auth-eyebrow">
              {mode === "login"
                ? "WELCOME BACK"
                : "CREATE YOUR SPACE"}
            </p>

            <h1>
              {mode === "login"
                ? "Welcome back."
                : "Make it yours."}
            </h1>

            <p>
              {mode === "login"
                ? "Sign in to continue building your personal media library."
                : "Create your Movo account and start tracking what you watch."}
            </p>
          </div>

          <form
            className="auth-form"
            onSubmit={handleSubmit}
          >
            {mode === "signup" && (
              <label className="auth-field">
                <span>Name</span>

                <input
                  type="text"
                  value={name}
                  onChange={(event) =>
                    setName(event.target.value)
                  }
                  placeholder="Your name"
                  autoComplete="name"
                  disabled={loading}
                />
              </label>
            )}

            <label className="auth-field">
              <span>Email</span>

              <input
                type="email"
                value={email}
                onChange={(event) =>
                  setEmail(event.target.value)
                }
                placeholder="you@example.com"
                autoComplete="email"
                disabled={loading}
              />
            </label>

            <label className="auth-field">
              <span>Password</span>

              <input
                type="password"
                value={password}
                onChange={(event) =>
                  setPassword(event.target.value)
                }
                placeholder="••••••••"
                autoComplete={
                  mode === "login"
                    ? "current-password"
                    : "new-password"
                }
                disabled={loading}
              />
            </label>

            {error && (
              <div className="auth-message auth-error">
                <span>!</span>
                <p>{error}</p>
              </div>
            )}

            {message && (
              <div className="auth-message auth-success">
                <span>✓</span>
                <p>{message}</p>
              </div>
            )}

            <button
              className="auth-submit"
              type="submit"
              disabled={loading}
            >
              {loading
                ? "Please wait..."
                : mode === "login"
                ? "Sign in"
                : "Create account"}

              {!loading && <span>→</span>}
            </button>
          </form>

          <div className="auth-switch">
            <span>
              {mode === "login"
                ? "Don't have an account?"
                : "Already have an account?"}
            </span>

            <button
              type="button"
              onClick={switchMode}
              disabled={loading}
            >
              {mode === "login"
                ? "Create one"
                : "Sign in"}
            </button>
          </div>
        </div>

        <p className="auth-footer">
          Your media space. Your history. Your way.
        </p>
      </div>
    </div>
  );
}