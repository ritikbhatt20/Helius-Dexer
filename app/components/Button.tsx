import { ButtonHTMLAttributes } from "react";

export const Button = (props: ButtonHTMLAttributes<HTMLButtonElement>) => (
  <button
    {...props}
    className={`bg-helius-orange text-white border-none py-3 px-6 rounded-md cursor-pointer text-base font-bold hover:bg-helius-yellow disabled:bg-gray-400 disabled:cursor-not-allowed ${props.className || ""}`}
  />
);
