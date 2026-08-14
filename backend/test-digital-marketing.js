import { extractSkillsFromJD } from './src/utils/skillExtractor.js';

const digitalMarketingJD = `
We are looking for an experienced Digital Marketing professional to join our team.

Required Skills:
- Digital Marketing expertise
- Social Media Marketing
- Content Marketing and creation
- Google Analytics proficiency
- Facebook Ads management
- Email Marketing campaigns
- SEO and SEM knowledge
- PPC advertising experience
- Brand Strategy development
- Market Research capabilities
- Customer Journey mapping

Preferred Skills:
- Video Marketing and production
- Conversion Rate Optimization (CRO)
- LinkedIn Ads management
- Adobe Creative Suite (Photoshop, Illustrator)
- Marketing Automation tools
- Graphic Design skills
- Affiliate Marketing experience
- Influencer Marketing network
- Retargeting campaign management
- Competitive Analysis tools

You should have excellent communication skills, analytical mind, and strong ROI focus.
`;

console.log('Testing Digital Marketing JD extraction...');
console.log('JD Description length:', digitalMarketingJD.length);
console.log('\n---');

const extracted = extractSkillsFromJD(digitalMarketingJD);
console.log('\nExtracted Required Skills:', extracted.requiredSkills);
console.log('Count:', extracted.requiredSkills.length);

console.log('\nExtracted Preferred Skills:', extracted.preferredSkills);
console.log('Count:', extracted.preferredSkills.length);

console.log('\nTotal Skills Extracted:', [...new Set([...extracted.requiredSkills, ...extracted.preferredSkills])].length);
