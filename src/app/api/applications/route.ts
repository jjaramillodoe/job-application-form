import { NextResponse } from 'next/server';
import clientPromise from '@/app/lib/mongodb';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const searchName = searchParams.get('searchName') || '';
    const searchCounselorEmail = searchParams.get('searchCounselorEmail') || '';
    const filterPayment = searchParams.get('filterPayment') || 'all';
    const filterStatus = searchParams.get('filterStatus') || 'all';
    const filterYear = searchParams.get('filterYear') || 'all';
    const filterDateFrom = searchParams.get('filterDateFrom') || '';
    const filterDateTo = searchParams.get('filterDateTo') || '';
    const sortBy = searchParams.get('sortBy') || '';
    const sortOrder = searchParams.get('sortOrder') || 'asc';

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);
    const collection = db.collection('applications');

    // Build query
    const query: any = {};
    const dateConditions: any[] = [];
    
    if (searchName) {
      query.$or = [
        { firstName: { $regex: searchName, $options: 'i' } },
        { lastName: { $regex: searchName, $options: 'i' } }
      ];
    }

    if (searchCounselorEmail) {
      query.counselor_email = { $regex: searchCounselorEmail, $options: 'i' };
    }

    if (filterPayment !== 'all') {
      query.fingerprintPaymentPreference = filterPayment;
    }

    if (filterStatus !== 'all') {
      query.status = filterStatus;
    }

    if (filterYear !== 'all') {
      const year = Number(filterYear);
      const nextYear = year + 1;
      const yearStart = `${year}-01-01T00:00:00.000Z`;
      const yearEnd = `${nextYear}-01-01T00:00:00.000Z`;

      dateConditions.push({
        $or: [
          { submittedAt: { $gte: new Date(yearStart), $lt: new Date(yearEnd) } },
          { submittedAt: { $gte: yearStart, $lt: yearEnd } },
        ],
      });
    }

    if (filterDateFrom || filterDateTo) {
      const dateQuery: any = {};
      const stringDateQuery: any = {};

      if (filterDateFrom) {
        const from = new Date(filterDateFrom);
        dateQuery.$gte = from;
        stringDateQuery.$gte = from.toISOString();
      }
      if (filterDateTo) {
        const to = new Date(filterDateTo);
        to.setHours(23, 59, 59, 999);
        dateQuery.$lte = to;
        stringDateQuery.$lte = to.toISOString();
      }

      dateConditions.push({
        $or: [
          { submittedAt: dateQuery },
          { submittedAt: stringDateQuery },
        ],
      });
    }

    if (dateConditions.length > 0) {
      query.$and = dateConditions;
    }

    // Build sort
    const sort: any = {};
    if (sortBy) {
      sort[sortBy] = sortOrder === 'asc' ? 1 : -1;
    }

    const total = await collection.countDocuments(query);
    const applications = await collection
      .find(query)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit)
      .toArray();

    return NextResponse.json({
      applications,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch applications' },
      { status: 500 }
    );
  }
} 