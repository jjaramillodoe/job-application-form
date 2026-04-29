import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/app/lib/mongodb';
import { parse } from 'csv-parse/sync';

export const dynamic = 'force-dynamic';

function normalizeCouponCode(value: unknown) {
  return String(value || '').trim();
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const text = await file.text();
    const rows = parse(text, {
      skip_empty_lines: true,
      trim: true,
      relax_column_count: true,
    }) as string[][];

    const codes = rows
      .map((row) => normalizeCouponCode(row[0]))
      .filter(Boolean)
      .filter((code, index) => {
        const normalized = code.toLowerCase().replace(/[\s_-]/g, '');
        return index !== 0 || !['couponcode', 'code', 'coupon'].includes(normalized);
      });

    const uniqueCodes = Array.from(new Set(codes));

    if (uniqueCodes.length === 0) {
      return NextResponse.json(
        { error: 'No coupon codes found in CSV' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);
    const collection = db.collection('coupons');
    const now = new Date().toISOString();

    const result = await collection.bulkWrite(
      uniqueCodes.map((couponCode) => ({
        updateOne: {
          filter: { coupon_code: couponCode },
          update: {
            $setOnInsert: {
              coupon_code: couponCode,
              coupon_year: 2026,
              assigned_to: null,
              assigned_at: null,
              status: 'available',
              created_at: now,
            },
          },
          upsert: true,
        },
      }))
    );

    return NextResponse.json({
      success: true,
      receivedCount: uniqueCodes.length,
      insertedCount: result.upsertedCount,
      existingCount: uniqueCodes.length - result.upsertedCount,
    });
  } catch (error) {
    console.error('Error uploading 2026 coupons:', error);
    return NextResponse.json(
      { error: 'Failed to upload coupons' },
      { status: 500 }
    );
  }
}
