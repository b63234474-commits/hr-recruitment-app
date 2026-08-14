import mongoose from 'mongoose';
import Job from './src/models/Job.js';
import { extractSkillsFromJD } from './src/utils/skillExtractor.js';
import env from './src/config/env.js';

// Connect to MongoDB
await mongoose.connect(env.mongodbUri);

console.log('Connected to MongoDB');

// Find Digital Marketing job
const digitalMarketingJob = await Job.findOne({ jobTitle: /digital.*marketing/i });

if (digitalMarketingJob) {
  console.log('Found Digital Marketing job:', digitalMarketingJob.jobTitle);
  console.log('Current requiredSkills:', digitalMarketingJob.requiredSkills);
  console.log('---');
  
  // Extract skills from job description
  const extracted = extractSkillsFromJD(digitalMarketingJob.jobDescription);
  console.log('Extracted required skills:', extracted.requiredSkills);
  console.log('Extracted preferred skills:', extracted.preferredSkills);
  
  // Update job with extracted skills
  await Job.findByIdAndUpdate(digitalMarketingJob._id, {
    requiredSkills: extracted.requiredSkills,
    preferredSkills: extracted.preferredSkills
  });
  
  console.log('✓ Job updated successfully!');
} else {
  console.log('No Digital Marketing job found in database');
  console.log('Creating test job...');
  
  const newJob = await Job.create({
    jobTitle: 'Digital Marketing Manager',
    department: 'Marketing',
    location: 'Remote',
    employmentType: 'Full-time',
    minimumExperience: 2,
    maximumExperience: 5,
    salaryRange: '40000-60000',
    education: 'Bachelor\'s Degree',
    numberOfOpenings: 1,
    recruiter: new mongoose.Types.ObjectId(),
    hiringManager: new mongoose.Types.ObjectId(),
    jobDescription: `
      We are looking for an experienced Digital Marketing Manager to join our team.
      
      Required Skills:
      - Digital Marketing expertise with 3+ years experience
      - Social Media Marketing across all major platforms
      - Content Marketing and strategy development
      - Google Analytics and data analysis
      - Facebook Ads and campaign management
      - Email Marketing automation and strategy
      - SEO and SEM knowledge and implementation
      - PPC advertising experience
      - Brand Strategy development and management
      - Market Research and competitive analysis
      - Customer Journey mapping and optimization
      
      Preferred Skills:
      - Video Marketing and production knowledge
      - Conversion Rate Optimization (CRO)
      - LinkedIn Ads and B2B marketing
      - Adobe Creative Suite skills
      - Marketing Automation platforms
      - Graphic Design capabilities
      - Affiliate Marketing network
      - Influencer Marketing experience
      - Retargeting campaign management
      
      Responsibilities:
      - Lead digital marketing campaigns across all channels
      - Develop and execute digital marketing strategy
      - Manage social media presence and engagement
      - Create and optimize content for digital channels
      - Analyze campaign performance and ROI
      - Manage digital marketing budget
      - Build and lead marketing team
    `,
    status: 'Active'
  });
  
  console.log('Test job created:', newJob._id);
  console.log('Job Title:', newJob.jobTitle);
  
  // Extract skills
  const extracted = extractSkillsFromJD(newJob.jobDescription);
  console.log('Extracted required skills:', extracted.requiredSkills);
  console.log('Count:', extracted.requiredSkills.length);
  
  // Update with extracted skills
  await Job.findByIdAndUpdate(newJob._id, {
    requiredSkills: extracted.requiredSkills,
    preferredSkills: extracted.preferredSkills
  });
  
  console.log('✓ Test job created and skills extracted!');
}

await mongoose.connection.close();
