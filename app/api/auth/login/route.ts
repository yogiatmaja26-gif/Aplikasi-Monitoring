import { NextRequest, NextResponse } from 'next/server';
import { getDb, logActivity } from '@/lib/db';
import { comparePassword, signToken } from '@/lib/auth';
import { Role } from '@/lib/types';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 });
    }

    const db = await getDb();
    const cleanEmail = email.trim().toLowerCase();
    const res = db.exec(`SELECT id, name, email, password_hash, role, created_at FROM users WHERE LOWER(email) = '${cleanEmail.replace(/'/g, "''")}';`);

    if (!res || res.length === 0 || !res[0].values[0]) {
      return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });
    }

    const row = res[0].values[0];
    const user = {
      id: row[0] as number,
      name: row[1] as string,
      email: row[2] as string,
      password_hash: row[3] as string,
      role: row[4] as Role,
      created_at: row[5] as string,
    };

    const isMatch = await comparePassword(password, user.password_hash);
    if (!isMatch) {
      return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });
    }

    const token = signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    });

    logActivity(user.id, 'LOGIN', 'USER', user.id, `User ${user.name} logged in`);

    const response = NextResponse.json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });

    // Also set httpOnly cookie for seamless session
    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json({ error: error.message || 'Login failed' }, { status: 500 });
  }
}
