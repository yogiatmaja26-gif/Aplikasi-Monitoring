import { NextRequest, NextResponse } from 'next/server';
import { getDashboardSummary } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const projectId = req.nextUrl.searchParams.get('projectId') ? Number(req.nextUrl.searchParams.get('projectId')) : 1;
    const summary = await getDashboardSummary(projectId);
    return NextResponse.json(summary);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
