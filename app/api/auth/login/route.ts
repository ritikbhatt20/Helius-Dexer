import { NextRequest, NextResponse } from "next/server";
import { UserModel } from "../../../lib/models/user";
import jwt from "jsonwebtoken";

export async function POST(req: NextRequest) {
  try {
    const bodyData = await req.json();
    const { email, password } = bodyData;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const user = await UserModel.findByEmail(email);
    if (!user || !(await UserModel.validatePassword(user, password))) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET || "secret",
      { expiresIn: "7d" }
    );

    return NextResponse.json({
      message: "Login successful",
      token,
      user: { id: user.id, email: user.email },
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
