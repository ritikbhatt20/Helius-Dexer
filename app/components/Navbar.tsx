"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export const Navbar = () => {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);

  // Function to check and set token
  const checkToken = () => {
    const storedToken = localStorage.getItem("token");
    setToken(storedToken);
  };

  useEffect(() => {
    // Initial check on mount
    checkToken();

    // Listen for storage events (e.g., when token is set or removed in another tab)
    window.addEventListener("storage", checkToken);

    // Listen for route changes to re-check token
    const handleRouteChange = () => {
      checkToken();
    };

    const interval = setInterval(checkToken, 500);

    return () => {
      window.removeEventListener("storage", checkToken);
      clearInterval(interval);
    };
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    setToken(null);
    router.push("/login");
  };

  return (
    <nav className="bg-gradient-to-r from-helius-orange to-orange-500 p-4 flex justify-between items-center shadow-lg">
      <Link href="/">
        <h1 className="text-white text-2xl font-extrabold tracking-tight hover:text-helius-yellow transition-colors duration-300">
          Helius Indexer
        </h1>
      </Link>
      <div className="flex items-center gap-6">
        {token ? (
          <>
            <Link
              href="/dashboard"
              className="text-white font-medium text-lg hover:text-helius-yellow transition-colors duration-300"
            >
              Dashboard
            </Link>
            <Link
              href="/connections"
              className="text-white font-medium text-lg hover:text-helius-yellow transition-colors duration-300"
            >
              Connections
            </Link>
            <Link
              href="/jobs"
              className="text-white font-medium text-lg hover:text-helius-yellow transition-colors duration-300"
            >
              Jobs
            </Link>
            <button
              onClick={handleLogout}
              className="bg-white text-helius-orange font-medium py-2 px-4 rounded-full shadow-md hover:bg-helius-yellow hover:text-white transition-all duration-300"
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <Link
              href="/login"
              className="text-white font-medium text-lg hover:text-helius-yellow transition-colors duration-300"
            >
              Login
            </Link>
            <Link
              href="/register"
              className="text-white font-medium text-lg hover:text-helius-yellow transition-colors duration-300"
            >
              Register
            </Link>
          </>
        )}
      </div>
    </nav>
  );
};
