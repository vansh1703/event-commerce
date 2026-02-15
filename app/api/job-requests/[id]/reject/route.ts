import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { notifyJobRejected } from '@/lib/email';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  console.log('🚀 REJECTION API CALLED'); // ✅ ADD THIS
  
  try {
    const params = await context.params;
    const body = await request.json();
    
    console.log('📥 Request body:', body); // ✅ ADD THIS
    
    const { rejectionReason } = body;

    console.log('🔍 Rejecting job request:', params.id);
    console.log('🔍 Rejection reason:', rejectionReason);

    // Get job request details first
    const { data: jobRequest, error: fetchError } = await supabaseAdmin
      .from('job_requests')
      .select('*')
      .eq('id', params.id)
      .single();

    if (fetchError || !jobRequest) {
      console.error('❌ Job request not found:', fetchError);
      return NextResponse.json(
        { success: false, error: 'Job request not found' },
        { status: 404 }
      );
    }

    console.log('✅ Job request found:', {
      id: jobRequest.id,
      company_id: jobRequest.company_id,
      title: jobRequest.title,
    });

    // Update job request status
    console.log('📝 Updating status to rejected...'); // ✅ ADD THIS
    
    const { error } = await supabaseAdmin
      .from('job_requests')
      .update({
        status: 'rejected',
        rejection_reason: rejectionReason,
      })
      .eq('id', params.id);

    if (error) {
      console.error('❌ Error updating job request:', error);
      throw error;
    }

    console.log('✅ Job request status updated to rejected');

    // ✅ SEND EMAIL NOTIFICATION TO COMPANY
    console.log('📧 Starting email notification process...'); // ✅ ADD THIS
    
    try {
      console.log('📧 Fetching company email for company_id:', jobRequest.company_id);

      // Get company email
      const { data: company, error: companyError } = await supabaseAdmin
        .from('users')
        .select('email, company_name')
        .eq('id', jobRequest.company_id)
        .single();

      console.log('📧 Company query result:', { 
        hasCompany: !!company,
        hasError: !!companyError,
        email: company?.email,
        companyName: company?.company_name
      });

      if (companyError) {
        console.error('❌ Error fetching company:', companyError);
        throw companyError;
      }

      if (!company) {
        console.error('❌ Company not found for id:', jobRequest.company_id);
      } else if (!company.email) {
        console.error('❌ Company has no email:', company);
      } else {
        console.log('✅ Company found:', {
          email: company.email,
          company_name: company.company_name,
        });

        console.log('📧 Calling notifyJobRejected function...'); // ✅ ADD THIS

        const emailResult = await notifyJobRejected(
          company.email,
          jobRequest.title,
          rejectionReason
        );

        console.log('📧 Email result:', emailResult);

        if (emailResult.success) {
          console.log('✅ Rejection email sent successfully to:', company.email);
        } else {
          console.error('❌ Email failed to send:', emailResult.error);
        }
      }
    } catch (emailError) {
      console.error('❌ Email notification error:', emailError);
      console.error('❌ Email error stack:', (emailError as Error).stack); // ✅ ADD THIS
      // Don't fail the request if email fails
    }

    console.log('✅ Rejection API completed successfully'); // ✅ ADD THIS
    return NextResponse.json({ success: true });
    
  } catch (error: any) {
    console.error('❌ Error rejecting job request:', error);
    console.error('❌ Error stack:', error.stack); // ✅ ADD THIS
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}