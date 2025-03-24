import { redirect } from "next/navigation";

export default function Home() {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;
  redirect(token ? "/dashboard" : "/login");
}
