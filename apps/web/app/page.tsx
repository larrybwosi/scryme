"use client";

import { useSession, signIn, signOut } from "@repo/auth/client";

export default function Home() {
  const { data: session, isPending } = useSession();

  if (isPending) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm lg:flex">
        <p className="fixed left-0 top-0 flex w-full justify-center border-b border-gray-300 bg-gradient-to-b from-zinc-200 pb-6 pt-8 backdrop-blur-2xl dark:border-neutral-800 dark:bg-zinc-800/30 dark:from-inherit lg:static lg:w-auto  lg:rounded-xl lg:border lg:bg-gray-200 lg:p-4 lg:dark:bg-zinc-800/30">
          Auth Package Verification
        </p>
      </div>

      <div className="mt-8 flex flex-col items-center gap-4">
        {session ? (
          <>
            <p>Welcome, {session.user.name || session.user.email}!</p>
            <button
              onClick={() => signOut()}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
            >
              Sign Out
            </button>
          </>
        ) : (
          <>
            <p>You are not signed in.</p>
            <div className="flex gap-2">
              <button
                onClick={() => signIn.social({ provider: "github" })}
                className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800 transition-colors"
              >
                Sign in with GitHub
              </button>
              <button
                onClick={() => signIn.social({ provider: "google" })}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
              >
                Sign in with Google
              </button>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
