"use client";

import { Button } from "@/components/ui/button";
import { CircuitBoard, LogOut } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuthStore } from "../lib/authStore";

export const Navbar = () => {
  const router = useRouter();
  const { token, setToken, checkToken } = useAuthStore();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    checkToken();
  }, [checkToken]);

  const handleLogout = () => {
    setToken(null);
    router.push("/login");
  };

  if (!isClient) {
    return (
      <nav className="bg-gradient-to-r from-helius-orange to-orange-500 p-4 flex justify-between items-center shadow-lg">
        <Link href="/">
          <h1 className="text-white text-2xl font-extrabold tracking-tight hover:text-helius-yellow transition-colors duration-300">
            Helius Indexer
          </h1>
        </Link>
        <div className="flex items-center gap-6">
          {/* Don't render auth-dependent links during SSR */}
        </div>
      </nav>
    );
  }

  return (
    // <nav className="bg-gradient-to-r from-helius-orange to-orange-500 p-4 flex justify-between items-center shadow-lg">
    //   <Link href="/">
    //     <h1 className="text-white text-2xl font-extrabold tracking-tight hover:text-helius-yellow transition-colors duration-300">
    //       Helius Indexer
    //     </h1>
    //   </Link>
    //   <div className="flex items-center gap-6">
    //     {token ? (
    //       <>
    //         <Link
    //           href="/dashboard"
    //           className="text-white font-medium text-lg hover:text-helius-yellow transition-colors duration-300"
    //         >
    //           Dashboard
    //         </Link>
    //         <Link
    //           href="/connections"
    //           className="text-white font-medium text-lg hover:text-helius-yellow transition-colors duration-300"
    //         >
    //           Connections
    //         </Link>
    //         <Link
    //           href="/jobs"
    //           className="text-white font-medium text-lg hover:text-helius-yellow transition-colors duration-300"
    //         >
    //           Jobs
    //         </Link>
    //         <button
    //           onClick={handleLogout}
    //           className="bg-white text-helius-orange font-medium py-2 px-4 rounded-full shadow-md hover:bg-helius-yellow hover:text-white transition-all duration-300"
    //         >
    //           Logout
    //         </button>
    //       </>
    //     ) : (
    //       <>
    //         <Link
    //           href="/login"
    //           className="text-white font-medium text-lg hover:text-helius-yellow transition-colors duration-300"
    //         >
    //           Login
    //         </Link>
    //         <Link
    //           href="/register"
    //           className="text-white font-medium text-lg hover:text-helius-yellow transition-colors duration-300"
    //         >
    //           Register
    //         </Link>
    //       </>
    //     )}
    //   </div>
    // </nav>
    <header className="fixed top-0 w-full flex justify-center border-b border-slate-800 bg-black">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <CircuitBoard className="h-8 w-8 text-helius-orange" />
          <span className="text-2xl font-bold bg-clip-text text-helius-orange ">
            Helius
          </span>
        </Link>
        <nav className="flex items-center gap-6">
          {token ? (
            <>
              <Link
                href="/dashboard"
                className="text-md font-medium text-white hover:text-helius-orange "
              >
                Dashboard
              </Link>
              <Link
                href="/connections"
                className="text-md font-medium text-white hover:text-helius-orange "
              >
                Connections
              </Link>
              <Link
                href="/jobs"
                className="text-md font-medium text-white hover:text-helius-orange "
              >
                Jobs
              </Link>

              <Button
                className="gap-2 text-white font-medium text-lg hover:text-helius-orange transition-colors duration-300"
                onClick={handleLogout}
              >
                <div className="flex items-center gap-2">
                  Logout
                  <LogOut size={16} />
                </div>
              </Button>
            </>
          ) : (
            <>
              <Button className="gap-2">
                <Link
                  href="/login"
                  className="text-white font-medium text-lg hover:text-helius-orange transition-colors duration-300"
                >
                  Login
                </Link>
              </Button>
              <Button className="gap-2">
                <Link
                  href="/register"
                  className="text-white font-medium text-lg hover:text-helius-orange transition-colors duration-300"
                >
                  Register
                </Link>
              </Button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
};
