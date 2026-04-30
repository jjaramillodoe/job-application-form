import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/app/lib/mongodb';
import { encryptData, tryDecryptData } from '@/app/lib/encryption';
import { ObjectId } from 'mongodb';

export const dynamic = 'force-dynamic';

function isValidObjectId(id: string) {
  return /^[0-9a-fA-F]{24}$/.test(id);
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!isValidObjectId(id)) {
      return NextResponse.json({ error: 'Invalid application id' }, { status: 400 });
    }

    const { db } = await connectToDatabase();
    const application = await db.collection('applications').findOne({ _id: new ObjectId(id) });
    
    if (!application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    // Decrypt sensitive data
    const decryptedApplication = {
      ...application,
      ssn: application.ssn ? tryDecryptData(application.ssn) : null,
      dateOfBirth: application.dateOfBirth ? tryDecryptData(application.dateOfBirth) : null,
    };
    
    return NextResponse.json(decryptedApplication);
  } catch (error) {
    console.error('Error fetching application:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!isValidObjectId(id)) {
      return NextResponse.json({ error: 'Invalid application id' }, { status: 400 });
    }

    const { db } = await connectToDatabase();
    const collection = db.collection('applications');

    // First check if the application exists
    const application = await collection.findOne({ _id: new ObjectId(id) });
    
    if (!application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    // Delete the application
    const result = await collection.deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Failed to delete application' }, { status: 500 });
    }

    // Return any associated coupon assignments to the available pool.
    const couponsCollection = db.collection('coupons');
    await couponsCollection.updateMany(
      { assigned_to: id },
      {
        $set: {
          assigned_to: null,
          assigned_at: null,
          status: 'available',
        },
      }
    );

    return NextResponse.json({ 
      message: 'Application deleted successfully',
      deletedCount: result.deletedCount 
    });
  } catch (error) {
    console.error('Delete application error:', error);
    return NextResponse.json(
      { error: 'Failed to delete application' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!isValidObjectId(id)) {
      return NextResponse.json({ error: 'Invalid application id' }, { status: 400 });
    }

    const { db } = await connectToDatabase();
    const body = await request.json();

    // Remove _id from the update body to prevent immutable field update
    const { _id, ...updateData } = body;

    // Encrypt sensitive data if it's being updated
    if (updateData.ssn) {
      updateData.ssn = encryptData(updateData.ssn);
    }
    if (updateData.dateOfBirth) {
      updateData.dateOfBirth = encryptData(updateData.dateOfBirth);
    }

    const result = await db.collection('applications').updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Application updated successfully' });
  } catch (error) {
    console.error('Error updating application:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 