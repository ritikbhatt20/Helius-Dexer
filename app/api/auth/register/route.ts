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

  const existingUser = await UserModel.findByEmail(email);
  if (existingUser) {
    return NextResponse.json({ error: "User already exists" }, { status: 400 });
  }

  const user = await UserModel.create({ email, password });
  const token = jwt.sign(
    { id: user.id, email: user.email },
    process.env.JWT_SECRET || "secret",
    { expiresIn: "7d" }
  );

  return NextResponse.json(
    {
      message: "User registered successfully",
      token,
      user: { id: user.id, email: user.email },
    },
    { status: 201 }
  );
}
