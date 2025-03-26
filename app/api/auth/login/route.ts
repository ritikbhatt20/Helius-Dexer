import { NextRequest, NextResponse } from "next/server";
import { UserModel } from "../../../lib/models/user";
import jwt from "jsonwebtoken";
import { validateDatabaseConnection } from "../../../lib/db";

export async function POST(req: NextRequest) {
  try {
    // First, test database connection
    const isDbConnected = await validateDatabaseConnection();
    if (!isDbConnected) {
      return NextResponse.json(
        { error: "Database connection failed" },
        { status: 500 }
      );
    }

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

    // More detailed error logging
    if (error instanceof Error) {
      return NextResponse.json(
        {
          error: "Internal server error",
          details: error.message,
          stack:
            process.env.NODE_ENV === "development" ? error.stack : undefined,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: "Unknown server error" },
      { status: 500 }
    );
  }
}
