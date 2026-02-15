import nodemailer from 'nodemailer';

// Create Gmail transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

// ✅ Send email via Gmail SMTP
export async function sendEmail(to: string, subject: string, html: string) {
  try {
    console.log('📧 Sending email via Gmail to:', to);
    console.log('📧 Subject:', subject);
    
    const info = await transporter.sendMail({
      from: `"EventHire" <${process.env.GMAIL_USER}>`,
      to,
      subject,
      html,
    });

    console.log('✅ Email sent successfully! Message ID:', info.messageId);
    return { success: true, data: info };
  } catch (error: any) {
    console.error('❌ Email send error:', error);
    return { success: false, error: error.message };
  }
}

// ✅ NOTIFICATION: Company submits job request
export async function notifyJobRequestSubmitted(
  superAdminEmail: string,
  companyName: string,
  jobTitle: string
) {
  console.log('📧 Sending job request notification...');
  
  const subject = '🔔 New Job Request - EventHire';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb; border-radius: 10px;">
      <div style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 28px;">EventHire</h1>
      </div>
      
      <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px;">
        <h2 style="color: #6366f1; margin-top: 0;">🔔 New Job Request</h2>
        
        <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 10px 0;"><strong style="color: #374151;">Company:</strong> <span style="color: #6366f1;">${companyName}</span></p>
          <p style="margin: 10px 0;"><strong style="color: #374151;">Job Title:</strong> <span style="color: #6366f1;">${jobTitle}</span></p>
        </div>
        
        <p style="color: #6b7280; line-height: 1.6;">
          A new job request is waiting for your approval. Please review the details and approve or reject the request.
        </p>
        
        <div style="text-align: center; margin-top: 30px;">
          <a href="https://event-commerce.vercel.app/superadmin/dashboard" 
             style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; box-shadow: 0 4px 6px rgba(99, 102, 241, 0.3);">
            Review Request →
          </a>
        </div>
      </div>
      
      <div style="text-align: center; margin-top: 20px; color: #9ca3af; font-size: 12px;">
        <p>© 2026 EventHire. All rights reserved.</p>
      </div>
    </div>
  `;

  return await sendEmail(superAdminEmail, subject, html);
}

// ✅ NOTIFICATION: Job approved
export async function notifyJobApproved(
  companyEmail: string,
  jobTitle: string,
  eventDate: string
) {
  console.log('📧 Sending job approval notification...');
  
  const subject = '✅ Job Approved - EventHire';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb; border-radius: 10px;">
      <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 28px;">EventHire</h1>
      </div>
      
      <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px;">
        <h2 style="color: #10b981; margin-top: 0;">✅ Your Job Has Been Approved!</h2>
        
        <p style="font-size: 16px; color: #374151; line-height: 1.6;">
          Great news! Your job request has been approved and is now live on EventHire.
        </p>
        
        <div style="background: #ecfdf5; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
          <p style="margin: 10px 0;"><strong style="color: #374151;">Job:</strong> <span style="color: #10b981;">${jobTitle}</span></p>
          <p style="margin: 10px 0;"><strong style="color: #374151;">Event Date:</strong> <span style="color: #10b981;">${eventDate}</span></p>
        </div>
        
        <div style="background: #f0fdf4; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="color: #059669; margin: 0;">
            <strong>🎉 Your job is now live!</strong><br>
            Qualified candidates can now view and apply for your event.
          </p>
        </div>
        
        <div style="text-align: center; margin-top: 30px;">
          <a href="https://event-commerce.vercel.app/company/dashboard" 
             style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; box-shadow: 0 4px 6px rgba(16, 185, 129, 0.3);">
            View Dashboard →
          </a>
        </div>
      </div>
      
      <div style="text-align: center; margin-top: 20px; color: #9ca3af; font-size: 12px;">
        <p>© 2026 EventHire. All rights reserved.</p>
      </div>
    </div>
  `;

  return await sendEmail(companyEmail, subject, html);
}

// ✅ NOTIFICATION: Job rejected
export async function notifyJobRejected(
  companyEmail: string,
  jobTitle: string,
  reason: string
) {
  console.log('📧 Sending job rejection notification...');
  
  const subject = '❌ Job Request Rejected - EventHire';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb; border-radius: 10px;">
      <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 28px;">EventHire</h1>
      </div>
      
      <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px;">
        <h2 style="color: #ef4444; margin-top: 0;">❌ Job Request Rejected</h2>
        
        <div style="background: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ef4444;">
          <p style="margin: 10px 0;"><strong style="color: #374151;">Job:</strong> <span style="color: #ef4444;">${jobTitle}</span></p>
          <p style="margin: 10px 0;"><strong style="color: #374151;">Reason:</strong> ${reason}</p>
        </div>
        
        <p style="color: #6b7280; line-height: 1.6;">
          Unfortunately, your job request could not be approved at this time. Please review the reason above and submit a new request with the necessary corrections.
        </p>
        
        <div style="text-align: center; margin-top: 30px;">
          <a href="https://event-commerce.vercel.app/company/dashboard" 
             style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; box-shadow: 0 4px 6px rgba(99, 102, 241, 0.3);">
            Go to Dashboard →
          </a>
        </div>
      </div>
      
      <div style="text-align: center; margin-top: 20px; color: #9ca3af; font-size: 12px;">
        <p>© 2026 EventHire. All rights reserved.</p>
      </div>
    </div>
  `;

  return await sendEmail(companyEmail, subject, html);
}

// ✅ NOTIFICATION: New application
export async function notifyNewApplication(
  superAdminEmail: string,
  seekerName: string,
  jobTitle: string,
  companyName: string
) {
  console.log('📧 Sending new application notification...');
  
  const subject = '🔔 New Application - EventHire';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb; border-radius: 10px;">
      <div style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 28px;">EventHire</h1>
      </div>
      
      <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px;">
        <h2 style="color: #6366f1; margin-top: 0;">🔔 New Job Application</h2>
        
        <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 10px 0;"><strong style="color: #374151;">Seeker:</strong> <span style="color: #6366f1;">${seekerName}</span></p>
          <p style="margin: 10px 0;"><strong style="color: #374151;">Job:</strong> <span style="color: #6366f1;">${jobTitle}</span></p>
          <p style="margin: 10px 0;"><strong style="color: #374151;">Company:</strong> <span style="color: #6366f1;">${companyName}</span></p>
        </div>
        
        <p style="color: #6b7280; line-height: 1.6;">
          A new job seeker has applied for this position. Please review their application and approve or reject as needed.
        </p>
        
        <div style="text-align: center; margin-top: 30px;">
          <a href="https://event-commerce.vercel.app/superadmin/dashboard" 
             style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; box-shadow: 0 4px 6px rgba(99, 102, 241, 0.3);">
            Review Application →
          </a>
        </div>
      </div>
      
      <div style="text-align: center; margin-top: 20px; color: #9ca3af; font-size: 12px;">
        <p>© 2026 EventHire. All rights reserved.</p>
      </div>
    </div>
  `;

  return await sendEmail(superAdminEmail, subject, html);
}

// ✅ NOTIFICATION: Application accepted
export async function notifyApplicationAccepted(
  seekerEmail: string,
  seekerName: string,
  jobTitle: string,
  companyName: string,
  eventDate: string,
  payment: string
) {
  console.log('📧 Sending application acceptance notification...');
  
  const subject = '🎉 You Got the Job! - EventHire';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb; border-radius: 10px;">
      <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 28px;">EventHire</h1>
        <p style="color: white; margin: 10px 0 0 0; font-size: 24px;">🎉</p>
      </div>
      
      <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px;">
        <h2 style="color: #10b981; margin-top: 0;">🎉 Congratulations ${seekerName}!</h2>
        
        <p style="font-size: 16px; color: #374151; line-height: 1.6;">
          Great news! You've been <strong style="color: #10b981;">ACCEPTED</strong> for the following job:
        </p>
        
        <div style="background: #ecfdf5; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
          <p style="margin: 10px 0;"><strong style="color: #374151;">💼 Job:</strong> ${jobTitle}</p>
          <p style="margin: 10px 0;"><strong style="color: #374151;">🏢 Company:</strong> ${companyName}</p>
          <p style="margin: 10px 0;"><strong style="color: #374151;">📅 Date:</strong> ${eventDate}</p>
          <p style="margin: 10px 0;"><strong style="color: #374151;">💰 Payment:</strong> ${payment}</p>
        </div>
        
        <div style="background: #f0fdf4; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="color: #059669; margin: 0;">
            <strong>📞 Next Steps:</strong><br>
            The company will contact you soon with final event details and instructions.
          </p>
        </div>
        
        <div style="text-align: center; margin-top: 30px;">
          <a href="https://event-commerce.vercel.app/my-applications" 
             style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; box-shadow: 0 4px 6px rgba(16, 185, 129, 0.3);">
            View Application Details →
          </a>
        </div>
      </div>
      
      <div style="text-align: center; margin-top: 20px; color: #9ca3af; font-size: 12px;">
        <p>© 2026 EventHire. All rights reserved.</p>
      </div>
    </div>
  `;

  return await sendEmail(seekerEmail, subject, html);
}

// ✅ NOTIFICATION: Application rejected
export async function notifyApplicationRejected(
  seekerEmail: string,
  seekerName: string,
  jobTitle: string
) {
  console.log('📧 Sending application rejection notification...');
  
  const subject = 'Application Update - EventHire';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb; border-radius: 10px;">
      <div style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 28px;">EventHire</h1>
      </div>
      
      <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px;">
        <h2 style="color: #6366f1; margin-top: 0;">Application Update</h2>
        
        <p style="font-size: 16px; color: #374151; line-height: 1.6;">
          Hi ${seekerName},
        </p>
        
        <p style="color: #6b7280; line-height: 1.6;">
          Thank you for applying for <strong>"${jobTitle}"</strong>. Unfortunately, your application was not selected this time.
        </p>
        
        <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="color: #6366f1; margin: 0;">
            <strong>💪 Don't give up!</strong><br>
            Keep applying to other opportunities. New jobs are posted daily on EventHire.
          </p>
        </div>
        
        <div style="text-align: center; margin-top: 30px;">
          <a href="https://event-commerce.vercel.app/events" 
             style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; box-shadow: 0 4px 6px rgba(99, 102, 241, 0.3);">
            Browse Available Jobs →
          </a>
        </div>
      </div>
      
      <div style="text-align: center; margin-top: 20px; color: #9ca3af; font-size: 12px;">
        <p>© 2026 EventHire. All rights reserved.</p>
      </div>
    </div>
  `;

  return await sendEmail(seekerEmail, subject, html);
}