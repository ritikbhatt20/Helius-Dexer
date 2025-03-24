import { NextRequest } from "next/server";
import jwt from "jsonwebtoken";
import { UserModel } from "../models/user";

export async function authenticate(
  req: NextRequest
): Promise<{ id: number; email: string } | null> {
  const authHeader = req.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret") as {
      id: number;
      email: string;
    };
    const user = await UserModel.findById(decoded.id);
    if (!user) return null;
    return { id: user.id, email: user.email };
  } catch {
    return null;
  }
}
