import fs from 'fs';
import path from 'path';

const extractText = async (filePath, mimetype) => {
  if (mimetype === 'application/pdf') {
    const pdfParse = await import('pdf-parse');
    const data = await pdfParse.default(fs.readFileSync(filePath));
    return data.text;
  }

  if (
    mimetype ===
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    mimetype === 'application/msword'
  ) {
    const mammoth = await import('mammoth');
    const data = await mammoth.extractRawText({ path: filePath });
    return data.value;
  }

  return '';
};

// Test DOCX extraction
const docxFile = './uploads/resume-1786448851229.docx';
const pdfFile = './uploads/resume-1786685874842.pdf';

console.log('Testing DOCX extraction...');
const docxText = await extractText(docxFile, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
console.log('Full DOCX text:');
console.log(docxText);
console.log('\n\n=================================\n\n');

console.log('Testing PDF extraction...');
const pdfText = await extractText(pdfFile, 'application/pdf');
console.log('Full PDF text:');
console.log(pdfText);
