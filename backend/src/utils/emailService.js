const smtpConfigured = Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD);

export const sendOfferEmail = async ({ to, candidateName, offer, attachmentPath }) => {
  const message = {
    to,
    subject: `Offer Letter - ${offer.jobId.jobTitle}`,
    template: 'Offer Letter',
    candidateName,
    attachmentPath,
  };

  if (!smtpConfigured) {
    console.log('[mock-email]', JSON.stringify(message));
    return { delivered: false, mode: 'mock', message };
  }

  console.log('[email-placeholder] SMTP is configured, but no transport was enabled.', JSON.stringify(message));
  return { delivered: false, mode: 'configured-placeholder', message };
};

export const sendSelectionEmail = async (candidate) => {
  console.log('[mock-email]', JSON.stringify({ to: candidate.email, template: 'Selection', candidateName: `${candidate.firstName} ${candidate.lastName}` }));
};

export const sendRejectionEmail = async (candidate) => {
  console.log('[mock-email]', JSON.stringify({ to: candidate.email, template: 'Rejection', candidateName: `${candidate.firstName} ${candidate.lastName}` }));
};
