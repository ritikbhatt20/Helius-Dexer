import { ReactNode } from "react";

export const Card = ({ children }: { children: ReactNode }) => (
  <div className="bg-white border-2 border-[#f5a623] rounded-lg p-6 my-4 shadow-md hover:-translate-y-1 transition-transform">
    {children}
  </div>
);
