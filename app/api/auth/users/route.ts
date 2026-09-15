import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
  try {
    const db = await getDb();
    const res = db.exec('SELECT id, name, email, role, created_at FROM users ORDER BY id ASC;');
    if (!res || res.length === 0) return NextResponse.json({ users: [] });
    
    const columns = res[0].columns;
    const users = res[0].values.map((v: any[]) => {
      const u: Record<string, any> = {};
      columns.forEach((c, idx) => { u[c] = v[idx]; });
      return u;
    });

    return NextResponse.json({ users });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
