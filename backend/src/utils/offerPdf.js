import fs from 'fs';
import path from 'path';
import PDFDocument from 'pdfkit';

const safe = (value) => value || 'Not provided';

export const generateOfferPdf = (offer) => {
  const offersPath = path.join(process.cwd(), 'uploads', 'offers');
  fs.mkdirSync(offersPath, { recursive: true });
  const filename = `${offer.offerId}.pdf`;
  const filePath = path.join(offersPath, filename);

  const document = new PDFDocument({ margin: 56 });
  const stream = fs.createWriteStream(filePath);
  document.pipe(stream);

  const candidateName = `${offer.candidateId.firstName} ${offer.candidateId.lastName}`;
  const date = (value) => value ? new Date(value).toLocaleDateString() : 'Not provided';

  document.fontSize(20).font('Helvetica-Bold').text('HR Recruitment Management System', { align: 'center' });
  document.moveDown(0.5).fontSize(16).text('Offer Letter', { align: 'center' });
  document.moveDown(1).fontSize(10).font('Helvetica').text(`Offer ID: ${offer.offerId}`);
  document.text(`Offer Date: ${date(offer.offerDate)}`);
  document.moveDown(1);
  document.font('Helvetica-Bold').fontSize(12).text(`Dear ${candidateName},`);
  document.moveDown(0.7).font('Helvetica').fontSize(11).text(
    `We are pleased to offer you the position of ${safe(offer.jobId.jobTitle)} in the ${safe(offer.jobId.department)} department.`
  );
  document.moveDown(1).font('Helvetica-Bold').text('Offer Details');
  document.moveDown(0.3).font('Helvetica');
  [
    ['Job title', offer.jobId.jobTitle],
    ['Department', offer.jobId.department],
    ['Salary', offer.salary],
    ['Benefits', offer.benefits],
    ['Joining date', date(offer.joiningDate)],
    ['Location', offer.location],
    ['Employment type', offer.employmentType],
    ['Reporting manager', offer.reportingManager],
    ['Offer expiry', date(offer.expiryDate)],
  ].forEach(([label, value]) => document.text(`${label}: ${safe(value)}`));
  document.moveDown(1).font('Helvetica-Bold').text('Terms and Conditions');
  document.moveDown(0.3).font('Helvetica').text(
    'This offer is subject to verification of the information provided during recruitment, completion of required documentation, and compliance with company policies. The offer must be accepted by the expiry date shown above.'
  );
  document.moveDown(1.5).text('Sincerely,');
  document.moveDown(1).font('Helvetica-Bold').text('Authorized HR Signatory');
  document.font('Helvetica').text('HR Recruitment Management System');
  document.end();

  return new Promise((resolve, reject) => {
    stream.on('finish', () => resolve({ filePath, publicPath: `/uploads/offers/${filename}` }));
    stream.on('error', reject);
  });
};
