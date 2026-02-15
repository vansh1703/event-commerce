import { NextResponse } from 'next/server';
import { notifyJobRejected } from '@/lib/email';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email') || 'test@example.com';
  
  console.log('🧪 Testing rejection email to:', email);
  
  const result = await notifyJobRejected(
    email,
    'Test Job Title',
    'Testing rejection email functionality'
  );
  
  return NextResponse.json({
    success: result.success,
    result,
    email,
  });
}