import React, { useState } from "react";
import App from "./App";
import { auth, provider, signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "./firebase";
import { signInWithRedirect, getRedirectResult, setPersistence, browserLocalPersistence, onAuthStateChanged } from "firebase/auth";

export default function Auth() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [user, setUser] = useState(null);
  const [error, setError] = useState("");

  const formatFirebaseError = (e) => {
    const code = e?.code || "unknown";
    if (code === "auth/configuration-not-found" || code === "auth/operation-not-allowed") {
      return {
        title: "Sign-in provider not configured",
        detail: "Enable the provider in Firebase Console and add your domain to Authorized domains.",
        steps: [
          "Go to Firebase Console → Authentication → Sign-in method",
          "Enable Google and Email/Password",
          "Open Authentication → Settings → Authorized domains and ensure localhost (or your domain) is listed",
          "Restart the app after changes"
        ]
      };
    }
    if (code === "auth/invalid-email") {
      return { title: "Invalid email", detail: "Enter a valid email address.", steps: [] };
    }
    if (code === "auth/user-not-found") {
      return { title: "Account not found", detail: "Sign up first or check the email entered.", steps: [] };
    }
    if (code === "auth/wrong-password") {
      return { title: "Incorrect password", detail: "Try again or reset your password.", steps: [] };
    }
    if (code === "auth/invalid-credential") {
      return { title: "Invalid credentials", detail: "Check your email and password and try again.", steps: [] };
    }
    return { title: "Authentication error", detail: e?.message || "Something went wrong.", steps: [] };
  };

  // Complete redirect sign-in result on load
  React.useEffect(() => {
    let isMounted = true;
    // Ensure redirect state persists across reloads
    setPersistence(auth, browserLocalPersistence)
      .catch((e) => {
        console.warn("Failed to set auth persistence, falling back to default", e);
      })
      .finally(() => {
        // Try to complete any pending redirect
        getRedirectResult(auth)
          .then((result) => {
            if (result?.user && isMounted) {
              setUser(result.user);
            } else {
              console.debug("No redirect result user; waiting for onAuthStateChanged...");
            }
          })
          .catch((e) => {
            const info = formatFirebaseError(e);
            setError(JSON.stringify(info));
          });
      });

    // Always listen for auth state changes as a fallback
    const unsub = onAuthStateChanged(auth, (u) => {
      if (u && isMounted) {
        setUser(u);
      }
    });
    return () => { isMounted = false; };
  }, []);

  const handleGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      setUser(result.user);
    } catch (e) {
      const info = formatFirebaseError(e);
      setError(JSON.stringify(info));
    }
  };

  const handleSignIn = async (e) => {
    e.preventDefault();
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      setUser(result.user);
    } catch (e) {
      const info = formatFirebaseError(e);
      setError(JSON.stringify(info));
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      try { localStorage.setItem('onboarding.pending', '1'); } catch {}
      setUser(result.user);
    } catch (e) {
      const info = formatFirebaseError(e);
      setError(JSON.stringify(info));
    }
  };

  if (user) return <App />;

  return (
    <div className="min-h-screen flex items-center justify-center bg-purdue-gold text-purdue-black p-4 animate-fade-in">
      <div className="app-shell w-full max-w-2xl p-4 md:p-6">
        <div className="w-full max-w-md bg-black text-purdue-gold rounded-2xl shadow-lg p-8 border border-[color:var(--purdue-gold)] card-elevate animate-scale-in">
          <h1 className="text-2xl font-bold mb-2 animate-fade-in-up">Welcome back</h1>
          <p className="opacity-90 mb-6 animate-fade-in-up">Sign in to continue to Purdue Fitness Pal</p>

          <button
            type="button"
            onClick={handleGoogle}
            className="w-full inline-flex items-center justify-center gap-2 bg-white border border-[color:var(--purdue-gold)] text-purdue-black font-semibold py-2 px-4 rounded-xl hover:bg-[#f7f2e6] transition-colors mb-6 btn-animate"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="h-5 w-5" aria-hidden="true">
              <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.1 29.6 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.5-.4-3.5z"/>
              <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 18.9 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.1 29.6 4 24 4 16.1 4 9.1 8.5 6.3 14.7z"/>
              <path fill="#4CAF50" d="M24 44c5.2 0 10-2 13.6-5.3l-6.3-5.2C29.2 35.8 26.8 37 24 37c-5.2 0-9.6-3.3-11.2-8l-6.6 5.1C9.1 39.5 16.1 44 24 44z"/>
              <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-1 3.1-3.2 5.6-6 7.3l6.3 5.2C38 37.6 40 31.2 40 24c0-1.3-.1-2.5-.4-3.5z"/>
            </svg>
            Continue with Google
          </button>

        <form onSubmit={handleSignIn} className="space-y-4">
          <div className="text-left animate-fade-in-up">
            <label htmlFor="email" className="block text-sm font-medium">Email</label>
            <input
              id="email"
              name="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              type="email"
              autoComplete="email"
              className="mt-1 w-full rounded-lg border border-gray-700 bg-neutral-900 text-purdue-gold placeholder-gray-400 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purdue-gold focus:border-purdue-gold focus-glow"
            />
          </div>

          <div className="text-left animate-fade-in-up">
            <label htmlFor="password" className="block text-sm font-medium">Password</label>
            <input
              id="password"
              name="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              type="password"
              autoComplete="current-password"
              className="mt-1 w-full rounded-lg border border-gray-700 bg-neutral-900 text-purdue-gold placeholder-gray-400 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purdue-gold focus:border-purdue-gold focus-glow"
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              className="inline-flex justify-center bg-purdue-gold text-purdue-black font-semibold py-2 px-4 rounded-xl hover:bg-[#b89f6a] transition-colors btn-animate"
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={handleSignUp}
              className="inline-flex justify-center border border-[color:var(--purdue-gold)] text-purdue-gold font-semibold py-2 px-4 rounded-xl hover:bg-neutral-900 transition-colors btn-animate"
            >
              Sign Up
            </button>
          </div>
        </form>

        {error && (() => {
          let parsed
          try { parsed = JSON.parse(error) } catch { parsed = { title: "Authentication error", detail: error, steps: [] } }
          return (
            <div className="mt-6 rounded-lg border border-red-400 bg-red-50/20 text-red-300 p-4 animate-fade-in">
              <div className="font-semibold mb-1">{parsed.title}</div>
              {parsed.detail && <div className="mb-2">{parsed.detail}</div>}
              {parsed.steps && parsed.steps.length > 0 && (
                <ul className="list-disc pl-5">
                  {parsed.steps.map((s, i) => (<li key={i}>{s}</li>))}
                </ul>
              )}
            </div>
          )
        })()}
        </div>
      </div>
    </div>
  );
}
