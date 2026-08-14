import { extractSkillsFromText } from './src/utils/skillExtractor.js';

// Sample resume text
const sampleResume = `
John Doe
john@example.com | (555) 123-4567 | New York, NY

PROFESSIONAL SUMMARY
Experienced full-stack developer with 5+ years in web development.

TECHNICAL SKILLS
- Frontend: React.js, JavaScript, HTML5, CSS3, Bootstrap, React Router
- Backend: Node.js, Express.js, MongoDB, PostgreSQL
- Tools: Git, GitHub, Axios, Redux, Vite
- Languages: JavaScript, TypeScript, Python
- Other: REST API, GraphQL, Linux, Docker

PROFESSIONAL EXPERIENCE
Senior Frontend Developer | Tech Company | 2021 - Present
- Developed React.js applications using Redux for state management
- Implemented responsive designs with CSS3 and Bootstrap
- Used Axios for API calls and React Router for navigation
- Managed code with Git and GitHub

Full Stack Developer | StartUp Inc | 2019 - 2021
- Built Node.js and Express.js backend services
- Worked with MongoDB and PostgreSQL databases
- Created REST APIs and implemented GraphQL queries
- Used Vite for bundling React applications

EDUCATION
Bachelor of Science in Computer Science | State University | 2019
`;

console.log('Testing skill extraction...');
console.log('Input resume text length:', sampleResume.length);
console.log('');

const extractedSkills = extractSkillsFromText(sampleResume);
console.log('Extracted Skills:', extractedSkills);
console.log('Number of skills extracted:', extractedSkills.length);
console.log('');

// Test with just a skill name
const simpleTest = 'I have React.js experience';
console.log('Simple test input:', simpleTest);
console.log('Simple test result:', extractSkillsFromText(simpleTest));
