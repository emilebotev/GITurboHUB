import { pool } from "@/pg.config";
import { isValidEmail } from "@/utils/api/auth.utils";
import bcrypt from "bcrypt";

export async function POST(request: Request) {
  const { email, password } = await request.json();

  if (!email || !password) {
    return new Response("Email and password are required", { status: 400 });
  }

  if (!isValidEmail(email)) {
    return new Response("Invalid email", { status: 400 });
  }

  const client = await pool.connect();
  const hashedPass = await bcrypt.hash(password, 10);

  try {
    const existingUser = await client.query(
      "SELECT id FROM users WHERE email = $1",
      [email]
    );

    if (existingUser.rows.length > 0) {
      return new Response("Email already exists", { status: 409 });
    }

    const result = await client.query(
      "INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id",
      [email, hashedPass]
    );

    const userId = result.rows[0].id;

    return new Response(JSON.stringify({ userId }), { status: 201 });
  } catch (error) {
    console.error("Error inserting user:", error);
    return new Response("Internal Server Error", { status: 500 });
  } finally {
    client.release();
  }
}
