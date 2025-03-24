import { db } from "../db";
import bcrypt from "bcrypt";

export interface User {
  id: number;
  email: string;
  password_hash: string;
  created_at: Date;
  updated_at: Date;
}

export interface UserInput {
  email: string;
  password: string;
}

export class UserModel {
  static async create({ email, password }: UserInput): Promise<User> {
    const password_hash = await bcrypt.hash(password, 10);
    const [user] = await db("users")
      .insert({ email, password_hash })
      .returning("*");
    return user;
  }

  static async findByEmail(email: string): Promise<User | undefined> {
    return db("users").where({ email }).first();
  }

  static async findById(id: number): Promise<User | undefined> {
    return db("users").where({ id }).first();
  }

  static async validatePassword(
    user: User,
    password: string
  ): Promise<boolean> {
    return bcrypt.compare(password, user.password_hash);
  }
}
