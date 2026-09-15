import { NextRequest, NextResponse } from 'next/server';
import { getMaterialDetail } from '@/lib/db';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const detail = await getMaterialDetail(Number(id));
    if (!detail) {
      return NextResponse.json({ error: 'Material not found' }, { status: 404 });
    }
    return NextResponse.json(detail);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
