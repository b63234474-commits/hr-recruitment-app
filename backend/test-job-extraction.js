import mongoose from 'mongoose';
import Job from './src/models/Job.js';
import { extractSkillsFromJD } from './src/utils/skillExtractor.js';
import env from './src/config/env.js';

await mongoose.connect(env.mongodbUri, { useNewUrlParser: true, useUnifiedTopology: true });

const job = await Job.findById('6a7d9bec731a48ba33f9c797');

console.log('Job found:');
console.log('Title:', job?.jobTitle);
console.log('Description length:', job?.jobDescription?.length);
console.log('Description preview:', job?.jobDescription?.substring(0, 200));
console.log('Current requiredSkills:', job?.requiredSkills);
console.log('Current preferredSkills:', job?.preferredSkills);

if (job?.jobDescription) {
  console.log('\nExtracting skills from description...');
  const extracted = extractSkillsFromJD(job.jobDescription);
  console.log('Extracted required skills:', extracted.requiredSkills);
  console.log('Extracted preferred skills:', extracted.preferredSkills);
  
  // Update the job
  job.requiredSkills = extracted.requiredSkills;
  job.preferredSkills = extracted.preferredSkills;
  await job.save();
  console.log('Job updated successfully!');
}

process.exit();
