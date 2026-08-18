import nodemailer from 'nodemailer';

const smtpConfigured = Boolean(
  process.env.EMAIL_USER && process.env.EMAIL_PASSWORD
);

let transporter = null;

const getTransporter = () => {
  if (!smtpConfigured) return null;

  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE || 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }

  return transporter;
};

const sendMail = async ({ to, subject, html, attachments }) => {
  const message = { to, subject, template: subject };

  if (!smtpConfigured) {
    console.log('[mock-email]', JSON.stringify(message));
    return { delivered: false, mode: 'mock', message };
  }

  try {
    const info = await getTransporter().sendMail({
      from: `"${process.env.EMAIL_FROM_NAME || 'HR Recruitment Team'}" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
      attachments,
    });

    console.log('[email-sent]', to, subject, info.messageId);
    return { delivered: true, mode: 'sent', messageId: info.messageId };
  } catch (err) {
    console.error('[email-failed]', to, subject, err.message);
    return { delivered: false, mode: 'error', error: err.message };
  }
};

export const sendOfferEmail = async ({ to, candidateName, offer, attachmentPath }) => {
  const jobTitle = offer?.jobId?.jobTitle || 'the position';

  const html = `
    <p>Dear ${candidateName},</p>
    <p>Congratulations! We are pleased to offer you the position of <strong>${jobTitle}</strong>.</p>
    <p>Please find your offer letter attached. Let us know if you have any questions.</p>
    <p>Best regards,<br/>HR Recruitment Team</p>
  `;

  return sendMail({
    to,
    subject: `Offer Letter - ${jobTitle}`,
    html,
    attachments: attachmentPath ? [{ path: attachmentPath }] : undefined,
  });
};

export const sendSelectionEmail = async (candidate) => {
  const candidateName = `${candidate.firstName} ${candidate.lastName}`;
  const html = `
    <p>Dear ${candidateName},</p>
    <p>Great news — you have been selected to move forward in our hiring process. Our team will be in touch shortly with next steps.</p>
    <p>Best regards,<br/>HR Recruitment Team</p>
  `;

  return sendMail({ to: candidate.email, subject: 'You have been selected', html });
};

export const sendRejectionEmail = async (candidate) => {
  const candidateName = `${candidate.firstName} ${candidate.lastName}`;
  const html = `
    <p>Dear ${candidateName},</p>
    <p>Thank you for taking the time to apply and interview with us. After careful consideration, we have decided to move forward with other candidates at this time.</p>
    <p>We appreciate your interest and wish you the best in your search.</p>
    <p>Best regards,<br/>HR Recruitment Team</p>
  `;

  return sendMail({ to: candidate.email, subject: 'Application Update', html });
};

export const sendInterviewInvitationEmail = async ({ candidate, job, interview }) => {
  const candidateName = `${candidate.firstName} ${candidate.lastName}`;
  const jobTitle = job?.jobTitle || 'the position';

  const dateStr = interview.interviewDate
    ? new Date(interview.interviewDate).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'TBD';

  const timeStr = interview.startTime
    ? `${interview.startTime}${interview.endTime ? ' - ' + interview.endTime : ''}`
    : '';

  const whereLine = interview.meetingLink
    ? `<p><strong>Meeting link:</strong> <a href="${interview.meetingLink}">${interview.meetingLink}</a></p>`
    : interview.location
    ? `<p><strong>Location:</strong> ${interview.location}</p>`
    : '';

  const html = `
    <p>Dear ${candidateName},</p>
    <p>We are pleased to invite you for an interview for the position of <strong>${jobTitle}</strong>.</p>
    <p><strong>Interview type:</strong> ${interview.interviewType || 'N/A'}</p>
    <p><strong>Date:</strong> ${dateStr}</p>
    ${timeStr ? `<p><strong>Time:</strong> ${timeStr}</p>` : ''}
    ${whereLine}
    ${interview.interviewer ? `<p><strong>Interviewer:</strong> ${interview.interviewer}</p>` : ''}
    ${interview.notes ? `<p><strong>Notes:</strong> ${interview.notes}</p>` : ''}
    <p>Please reply to confirm your availability. We look forward to speaking with you.</p>
    <p>Best regards,<br/>HR Recruitment Team</p>
  `;

  return sendMail({
    to: candidate.email,
    subject: `Interview Invitation - ${jobTitle}`,
    html,
  });
};

export const sendInterviewReminderEmail = async ({ candidate, job, interview }) => {
  const candidateName = `${candidate.firstName} ${candidate.lastName}`;
  const jobTitle = job?.jobTitle || 'the position';

  const dateStr = interview.interviewDate
    ? new Date(interview.interviewDate).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'TBD';

  const html = `
    <p>Dear ${candidateName},</p>
    <p>This is a friendly reminder about your upcoming interview for <strong>${jobTitle}</strong> on <strong>${dateStr}</strong>${interview.startTime ? ` at ${interview.startTime}` : ''}.</p>
    ${interview.meetingLink ? `<p><strong>Meeting link:</strong> <a href="${interview.meetingLink}">${interview.meetingLink}</a></p>` : ''}
    ${interview.location ? `<p><strong>Location:</strong> ${interview.location}</p>` : ''}
    <p>See you soon!</p>
    <p>Best regards,<br/>HR Recruitment Team</p>
  `;

  return sendMail({
    to: candidate.email,
    subject: `Reminder: Interview for ${jobTitle}`,
    html,
  });
};
