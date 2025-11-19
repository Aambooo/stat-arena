"use client";

import { SignIn, useUser } from "@clerk/nextjs";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const { isSignedIn } = useUser();
  const router = useRouter();

  // If already logged in → instantly go to /admin
  useEffect(() => {
    if (isSignedIn) {
      router.replace("/admin");
    }
  }, [isSignedIn]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-950 p-6">
      <div className="rounded-xl bg-neutral-900/50 border border-neutral-800 p-6 shadow-xl max-w-md w-full">
        <h1 className="text-center text-2xl font-bold mb-4 text-yellow-400">
          Admin Login
        </h1>

        <SignIn
          path="/admin/login"
          routing="path"
          afterSignInUrl="/admin"
          afterSignUpUrl="/admin"
          signUpUrl="/admin/login"
        />
      </div>
    </div>
  );
}
