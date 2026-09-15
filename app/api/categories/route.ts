import { NextRequest, NextResponse } from 'next/server';
import { getDb, persistDb, logActivity } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const db = await getDb();
    const projectId = req.nextUrl.searchParams.get('projectId') || '1';
    
    const res = db.exec(`
      SELECT 
        wc.*,
        (SELECT COUNT(*) FROM materials WHERE category_id = wc.id) as material_count,
        (SELECT COALESCE(SUM(rap_total_price), 0) FROM materials WHERE category_id = wc.id) as total_rap
      FROM work_categories wc
      WHERE wc.project_id = ${Number(projectId)}
      ORDER BY wc.id ASC;
    `);

    if (!res || res.length === 0) return NextResponse.json({ categories: [] });

    const columns = res[0].columns;
    const categories = res[0].values.map((v: any[]) => {
      const obj: Record<string, any> = {};
      columns.forEach((c, idx) => { obj[c] = v[idx]; });
      return obj;
    });

    return NextResponse.json({ categories });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    const body = await req.json();
    const { project_id, category_name, description } = body;

    if (!category_name) {
      return NextResponse.json({ error: 'Category name is required.' }, { status: 400 });
    }

    const db = await getDb();
    const now = new Date().toISOString();

    db.run(
      `INSERT INTO work_categories (project_id, category_name, description, created_at) VALUES (?, ?, ?, ?)`,
      [Number(project_id) || 1, category_name.trim(), description || null, now]
    );

    const newIdRes = db.exec("SELECT last_insert_rowid() as id;");
    const newId = newIdRes[0].values[0][0] as number;
    persistDb();

    logActivity(user ? user.id : null, 'CREATE_CATEGORY', 'WORK_CATEGORY', newId, `Created category ${category_name}`);

    return NextResponse.json({ success: true, id: newId }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
