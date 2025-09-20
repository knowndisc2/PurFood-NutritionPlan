import React, { useState } from "react";
import App from "./App";
import { auth, provider, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "./firebase";
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
      await signInWithRedirect(auth, provider);
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
      setUser(result.user);
    } catch (e) {
      const info = formatFirebaseError(e);
      setError(JSON.stringify(info));
    }
  };

  if (user) return <App />;

  return (
    <div>
      <button onClick={handleGoogle}>Sign in with Google</button>
      <form onSubmit={handleSignIn}>
        <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" />
        <input value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" type="password" />
        <button type="submit">Sign In</button>
        <button type="button" onClick={handleSignUp}>Sign Up</button>
      </form>
      {error && (() => {
        let parsed
        try { parsed = JSON.parse(error) } catch { parsed = { title: "Authentication error", detail: error, steps: [] } }
        return (
          <div style={{
            marginTop: 16,
            padding: 12,
            border: "1px solid #f5c2c7",
            background: "#f8d7da",
            color: "#842029",
            borderRadius: 6
          }}>
            <div style={{ fontWeight: 600, marginBottom: 6 }}>{parsed.title}</div>
            {parsed.detail && <div style={{ marginBottom: parsed.steps?.length ? 8 : 0 }}>{parsed.detail}</div>}
            {parsed.steps && parsed.steps.length > 0 && (
              <ul style={{ margin: 0, paddingLeft: 18 }}>
                {parsed.steps.map((s, i) => (<li key={i}>{s}</li>))}
              </ul>
            )}
          </div>
        )
      })()}
    </div>
  );
}
