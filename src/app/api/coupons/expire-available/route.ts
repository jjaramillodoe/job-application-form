import { NextResponse } from 'next/server';
import clientPromise from '@/app/lib/mongodb';

export const dynamic = 'force-dynamic';

export async function PATCH() {
  try {
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);
    const collection = db.collection('coupons');

    const result = await collection.updateMany(
      { status: 'available' },
      {
        $set: {
          status: 'expired',
          expired_at: new Date().toISOString(),
        },
      }
    );

    return NextResponse.json({
      success: true,
      expiredCount: result.modifiedCount,
    });
  } catch (error) {
    console.error('Error expiring available coupons:', error);
    return NextResponse.json(
      { error: 'Failed to expire available coupons' },
      { status: 500 }
    );
  }
}
