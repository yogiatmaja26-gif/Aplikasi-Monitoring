import { NextRequest, NextResponse } from 'next/server';
import { getDb, persistDb, logActivity } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

export async function GET() {
  try {
    const db = await getDb();
    const res = db.exec(`
      SELECT 
        p.*,
        (SELECT COUNT(*) FROM materials WHERE project_id = p.id) as total_materials,
        (SELECT COUNT(*) FROM work_categories WHERE project_id = p.id) as total_categories
      FROM projects p
      ORDER BY p.id ASC;
    `);

    if (!res || res.length === 0) return NextResponse.json({ projects: [] });

    const columns = res[0].columns;
    const projects = res[0].values.map((v: any[]) => {
      const obj: Record<string, any> = {};
      columns.forEach((c, idx) => { obj[c] = v[idx]; });
      return obj;
    });

    return NextResponse.json({ projects });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    const body = await req.json();
    const { project_code, project_name, description, location, start_date, target_end_date, status } = body;

    if (!project_code || !project_name) {
      return NextResponse.json({ error: 'Project code and project name are required.' }, { status: 400 });
    }

    const db = await getDb();
    const now = new Date().toISOString();

    db.run(
      `INSERT INTO projects (project_code, project_name, description, location, start_date, target_end_date, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        project_code.trim(),
        project_name.trim(),
        description || null,
        location || null,
        start_date || null,
        target_end_date || null,
        status || 'PLANNING',
        now
      ]
    );

    const newIdRes = db.exec("SELECT last_insert_rowid() as id;");
    const newId = newIdRes[0].values[0][0] as number;
    persistDb();

    logActivity(user ? user.id : null, 'CREATE_PROJECT', 'PROJECT', newId, `Created project ${project_name} (${project_code})`);

    return NextResponse.json({ success: true, id: newId, message: 'Project created successfully' }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
