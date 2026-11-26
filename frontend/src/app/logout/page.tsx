"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { signOut } from "@/lib/auth";

export default function LogoutPage() {
  const router = useRouter();
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    signOut().then(() => {
      if (active) router.replace("/portal");
    }).catch((error: unknown) => {
      console.error("Logout failed:", error);
      if (active) setFailed(true);
    });
    return () => { active = false; };
  }, [router, attempt]);

  return <main>{failed ? <p role="alert">Could not log out. <button type="button" onClick={() => { setFailed(false); setAttempt((n) => n + 1); }}>Try again</button>.</p> : <p>Logging out...</p>}</main>;
}
