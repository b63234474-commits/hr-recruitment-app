import fs from 'fs';
import path from 'path';
import { extractSkillsFromText, extractEducationFromText } from './src/utils/skillExtractor.js';

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

// Test with actual uploaded files
const testFiles = [
  { path: './uploads/resume-1786685874842.pdf', type: 'application/pdf' },
  { path: './uploads/resume-1786448851229.docx', type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }
];

for (const file of testFiles) {
  if (fs.existsSync(file.path)) {
    console.log(`\n========================================`);
    console.log(`Testing: ${file.path}`);
    console.log(`========================================`);
    
    try {
      const text = await extractText(file.path, file.type);
      console.log(`Text extraction length: ${text.length}`);
      console.log(`Text preview (first 200 chars): ${text.substring(0, 200)}`);
      
      const skills = extractSkillsFromText(text);
      console.log(`Extracted Skills (${skills.length}):`, skills);
      
      const education = extractEducationFromText(text);
      console.log(`Extracted Education:`, education);
    } catch (error) {
      console.error(`Error processing ${file.path}:`, error.message);
    }
  } else {
    console.log(`File not found: ${file.path}`);
  }
}
