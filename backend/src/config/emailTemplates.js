export const EMAIL_TEMPLATES = {
  'Application Received': {
    subject: 'Application Received - {{jobTitle}}',
    message: `Dear {{candidateName}},\n\nThank you for applying for the {{jobTitle}} position. We have received your application and our recruitment team will review it shortly.\n\nWe will keep you updated on the next steps.\n\nRegards,\n{{recruiterName}}\n{{companyName}}`,
  },
  'Application Shortlisted': {
    subject: 'Application Shortlisted - {{jobTitle}}',
    message: `Dear {{candidateName}},\n\nWe are pleased to let you know that your application for the {{jobTitle}} position has been shortlisted. Our team would like to move forward with the next stage of the hiring process.\n\nWe will contact you with the upcoming steps.\n\nRegards,\n{{recruiterName}}\n{{companyName}}`,
  },
  'Interview Invitation': {
    subject: 'Interview Invitation - {{jobTitle}}',
    message: `Dear {{candidateName}},\n\nWe are pleased to invite you for an interview for the {{jobTitle}} position.\n\nWe will contact you with the interview details.\n\nRegards,\n{{recruiterName}}\n{{companyName}}`,
  },
  'Interview Reminder': {
    subject: 'Interview Reminder - {{jobTitle}}',
    message: `Dear {{candidateName}},\n\nThis is a reminder for your upcoming interview for the {{jobTitle}} position. Please be prepared to discuss your experience and qualifications.\n\nWe look forward to speaking with you.\n\nRegards,\n{{recruiterName}}\n{{companyName}}`,
  },
  'Interview Rescheduled': {
    subject: 'Interview Rescheduled - {{jobTitle}}',
    message: `Dear {{candidateName}},\n\nWe would like to inform you that your interview for the {{jobTitle}} position has been rescheduled. We will share the updated time and details shortly.\n\nThank you for your understanding.\n\nRegards,\n{{recruiterName}}\n{{companyName}}`,
  },
  Selected: {
    subject: 'Selected for {{jobTitle}}',
    message: `Dear {{candidateName}},\n\nCongratulations! We are pleased to inform you that you have been selected for the {{jobTitle}} position.\n\nOur team will share the next steps with you shortly.\n\nRegards,\n{{recruiterName}}\n{{companyName}}`,
  },
  Rejected: {
    subject: 'Application Status Update - {{jobTitle}}',
    message: `Dear {{candidateName}},\n\nThank you for your interest in the {{jobTitle}} position. After careful consideration, we have decided to move forward with other candidates for this role.\n\nWe appreciate your time and interest in our company.\n\nRegards,\n{{recruiterName}}\n{{companyName}}`,
  },
  'Offer Letter': {
    subject: 'Offer Letter - {{jobTitle}}',
    message: `Dear {{candidateName}},\n\nWe are pleased to offer you the {{jobTitle}} position with {{companyName}}. Please review the attached offer letter and let us know if you have any questions.\n\nWe look forward to welcoming you to the team.\n\nRegards,\n{{recruiterName}}\n{{companyName}}`,
  },
  Onboarding: {
    subject: 'Welcome to {{companyName}}',
    message: `Dear {{candidateName}},\n\nWelcome to {{companyName}}. We are excited to have you join us for the {{jobTitle}} position.\n\nOur onboarding team will guide you through the next steps.\n\nRegards,\n{{recruiterName}}\n{{companyName}}`,
  },
  'Custom Email': {
    subject: '{{jobTitle}} - Update',
    message: `Dear {{candidateName}},\n\nThank you for your continued interest in the {{jobTitle}} position.\n\nWe will keep you updated on the next steps.\n\nRegards,\n{{recruiterName}}\n{{companyName}}`,
  },
};

export const EMAIL_TEMPLATE_OPTIONS = Object.keys(EMAIL_TEMPLATES);

export const renderTemplate = (templateName, payload = {}) => {
  const template = EMAIL_TEMPLATES[templateName] || EMAIL_TEMPLATES['Custom Email'];
  const subject = template.subject.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, key) => {
    const value = payload[key];
    return value == null || value === 'undefined' || value === 'null' ? '' : String(value);
  });
  const message = template.message.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, key) => {
    const value = payload[key];
    return value == null || value === 'undefined' || value === 'null' ? '' : String(value);
  });

  return { subject, message };
};
