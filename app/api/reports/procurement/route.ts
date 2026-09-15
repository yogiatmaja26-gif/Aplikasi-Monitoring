import { NextRequest, NextResponse } from 'next/server';
import { getMaterials } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const categoryId = searchParams.get('categoryId') ? Number(searchParams.get('categoryId')) : undefined;
    const vendorId = searchParams.get('vendorId') ? Number(searchParams.get('vendorId')) : undefined;
    const procurementStatus = searchParams.get('procurementStatus') || undefined;

    const materials = await getMaterials({ categoryId, vendorId, procurementStatus });

    const procurementReport = materials.map(m => {
      const plannedQty = m.planned_quantity;
      const purchasedQty = m.purchased_quantity || 0;
      const remainingQty = Math.max(0, plannedQty - purchasedQty);
      const rapCost = m.rap_total_price;
      const actualCost = m.actual_total_cost || 0;
      const variance = rapCost - actualCost; // Positive = Under budget, Negative = Over budget
      const dpAmount = m.total_dp_amount || 0;
      const paidAmount = m.total_paid_amount || 0;
      const remainingPay = Math.max(0, actualCost - paidAmount);

      return {
        id: m.id,
        code: m.material_code,
        name: m.material_name,
        category: m.category_name,
        vendor: m.vendor_name,
        unit: m.unit,
        planned_quantity: plannedQty,
        purchased_quantity: purchasedQty,
        remaining_to_purchase: remainingQty,
        rap_unit_price: m.rap_unit_price,
        rap_total_price: rapCost,
        actual_total_cost: actualCost,
        budget_variance: variance,
        procurement_status: m.procurement_status,
        dp_amount: dpAmount,
        paid_amount: paidAmount,
        remaining_payment: remainingPay,
        fulfillment_percentage: plannedQty > 0 ? Math.min(100, Math.round((purchasedQty / plannedQty) * 100)) : 0,
      };
    });

    const totalRap = procurementReport.reduce((a, b) => a + b.rap_total_price, 0);
    const totalActual = procurementReport.reduce((a, b) => a + b.actual_total_cost, 0);
    const totalDp = procurementReport.reduce((a, b) => a + b.dp_amount, 0);
    const totalPaid = procurementReport.reduce((a, b) => a + b.paid_amount, 0);
    const totalRemainingPay = procurementReport.reduce((a, b) => a + b.remaining_payment, 0);

    return NextResponse.json({
      items: procurementReport,
      summary: {
        total_items: procurementReport.length,
        total_rap: totalRap,
        total_actual: totalActual,
        total_variance: totalRap - totalActual,
        total_dp: totalDp,
        total_paid: totalPaid,
        total_remaining_payment: totalRemainingPay,
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
