import { NextRequest, NextResponse } from "next/server";
import { UserModel } from "../../../lib/models/user";
import jwt from "jsonwebtoken";
import { body, validationResult } from "express-validator";

export async function POST(req: NextRequest) {
  const bodyData = await req.json();
  const errors = validationResult(bodyData);
  if (!errors.isEmpty()) {
    return NextResponse.json({ errors: errors.array() }, { status: 400 });
  }

  const { email, password } = bodyData;

  const user = await UserModel.findByEmail(email);
  if (!user || !(await UserModel.validatePassword(user, password))) {
    return NextResponse.json(
      { error: "Invalid email or password" },
      { status: 400 }
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
}
