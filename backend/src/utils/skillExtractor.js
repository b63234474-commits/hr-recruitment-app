/**
 * Skill extractor for ATS matching.
 * Extracts skills from resume text and job descriptions without requiring manual entry.
 */

const SKILL_DATABASE = {
  'JavaScript': ['javascript', 'js'],
  'TypeScript': ['typescript', 'ts'],
  'Python': ['python', 'py'],
  'Java': ['java'],
  'C': ['c'],
  'C++': ['c++', 'cpp', 'c plus plus', 'cplusplus'],
  'C#': ['c#', 'csharp', 'c sharp'],
  'PHP': ['php'],
  'Ruby': ['ruby'],
  'Go': ['go', 'golang'],
  'Rust': ['rust'],
  'Kotlin': ['kotlin'],
  'Swift': ['swift'],
  'Scala': ['scala'],
  'React.js': ['react.js', 'reactjs', 'react js', 'react'],
  'Angular': ['angular', 'angularjs'],
  'Vue.js': ['vue.js', 'vuejs', 'vue'],
  'Next.js': ['next.js', 'nextjs', 'next'],
  'Node.js': ['node.js', 'nodejs', 'node js', 'node'],
  'Express.js': ['express.js', 'expressjs', 'express js', 'express'],
  'Django': ['django'],
  'Flask': ['flask'],
  'Spring Boot': ['spring boot', 'springboot', 'spring'],
  'ASP.NET': ['asp.net', 'aspnet', 'asp net'],
  'FastAPI': ['fastapi', 'fast api'],
  'Nest.js': ['nest.js', 'nestjs', 'nest'],
  'MongoDB': ['mongodb', 'mongo db', 'mongo', 'mongod'],
  'MySQL': ['mysql'],
  'PostgreSQL': ['postgresql', 'postgres', 'postgre sql', 'psql'],
  'Redis': ['redis'],
  'SQLite': ['sqlite', 'sqlite3'],
  'GraphQL': ['graphql'],
  'REST API': ['rest api', 'rest apis', 'restful api', 'restful'],
  'Axios': ['axios'],
  'Redux': ['redux'],
  'Redux Toolkit': ['redux toolkit', 'redux-toolkit'],
  'React Router': ['react router', 'react-router', 'reactrouter'],
  'HTML5': ['html5', 'html 5', 'html'],
  'CSS3': ['css3', 'css 3', 'css'],
  'Bootstrap': ['bootstrap'],
  'Tailwind CSS': ['tailwind css', 'tailwindcss', 'tailwind'],
  'Material UI': ['material ui', 'material-ui', 'mui'],
  'Git': ['git'],
  'GitHub': ['github'],
  'GitLab': ['gitlab'],
  'Docker': ['docker'],
  'Kubernetes': ['kubernetes', 'k8s'],
  'AWS': ['aws', 'amazon web services'],
  'Azure': ['azure', 'microsoft azure'],
  'GCP': ['gcp', 'google cloud platform', 'google cloud'],
  'Firebase': ['firebase'],
  'Jenkins': ['jenkins'],
  'CI/CD': ['ci/cd', 'continuous integration', 'continuous deployment'],
  'JWT': ['jwt', 'json web token'],
  'OAuth': ['oauth', 'oauth 2.0'],
  'Postman': ['postman'],
  'Jira': ['jira'],
  'Vite': ['vite'],
  'Mongoose': ['mongoose'],
  'Digital Marketing': ['digital marketing', 'digital marketers', 'digital marketer'],
  'SEO': ['seo', 'search engine optimization'],
  'SEM': ['sem', 'search engine marketing'],
  'PPC': ['ppc', 'pay per click'],
  'Social Media Marketing': ['social media marketing', 'social media', 'smm'],
  'Content Marketing': ['content marketing', 'content creator', 'content creation'],
  'Email Marketing': ['email marketing', 'email campaigns', 'email'],
  'Google Analytics': ['google analytics', 'analytics', 'ga4'],
  'Facebook Ads': ['facebook ads', 'facebook advertising', 'facebook'],
  'Instagram Marketing': ['instagram', 'instagram marketing'],
  'LinkedIn Marketing': ['linkedin', 'linkedin marketing'],
  'Marketing Automation': ['marketing automation', 'automated marketing'],
  'Copywriting': ['copywriting', 'copywriter'],
  'Graphic Design': ['graphic design', 'graphic designer', 'design'],
  'Adobe Creative Suite': ['adobe', 'adobe creative', 'photoshop', 'illustrator', 'indesign'],
  'Canva': ['canva'],
  'Video Marketing': ['video marketing', 'video production'],
  'Brand Strategy': ['brand strategy', 'branding'],
  'Conversion Rate Optimization': ['conversion rate optimization', 'cro', 'conversion'],
  'Google Ads': ['google ads', 'google advertising'],
  'LinkedIn Ads': ['linkedin ads', 'linkedin advertising'],
  'Market Research': ['market research', 'research'],
  'Consumer Behavior': ['consumer behavior'],
  'Competitive Analysis': ['competitive analysis'],
  'Customer Journey': ['customer journey', 'customer experience', 'cx'],
  'Retargeting': ['retargeting', 'remarketing'],
  'Affiliate Marketing': ['affiliate marketing', 'affiliate'],
  'Influencer Marketing': ['influencer marketing', 'influencer'],
};

const normalizeSkillText = (value = '') =>
  String(value)
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[._/+\-]+/g, ' ')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const escapeRegex = (value = '') => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const buildRegexForVariation = (variation = '') => {
  const normalized = normalizeSkillText(variation);
  if (!normalized) return /$^/;

  const pattern = normalized
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => escapeRegex(part))
    .join('[\\s\\-_/.\\+]*');

  return new RegExp(`(^|[^a-z0-9])${pattern}(?=$|[^a-z0-9])`, 'i');
};

const normalizeSkillName = (skill = '') => normalizeSkillText(skill).replace(/\s+/g, ' ');

export const extractSkillsFromText = (text) => {
  if (!text || typeof text !== 'string') {
    return [];
  }

  const normalizedText = normalizeSkillText(text);
  const extractedSkills = new Set();

  const skillEntries = Object.entries(SKILL_DATABASE)
    .map(([canonical, variations]) => ({
      canonical,
      variations: [...new Set(variations.map((variation) => normalizeSkillText(variation)))].sort(
        (a, b) => b.length - a.length
      ),
    }))
    .sort((a, b) => b.variations[0].length - a.variations[0].length);

  for (const { canonical, variations } of skillEntries) {
    const matches = variations.some((variation) => {
      try {
        return buildRegexForVariation(variation).test(` ${normalizedText} `);
      } catch (error) {
        console.warn(`Invalid regex pattern for skill: ${variation}`, error.message);
        return false;
      }
    });

    if (matches) {
      extractedSkills.add(canonical);
    }
  }

  return Array.from(extractedSkills).sort((a, b) => a.localeCompare(b));
};

export const extractSkillsFromJD = (jobDescription) => {
  if (!jobDescription || typeof jobDescription !== 'string') {
    return { requiredSkills: [], preferredSkills: [], otherRequirements: [] };
  }

  const allSkills = extractSkillsFromText(jobDescription);
  const lowerDescription = jobDescription.toLowerCase();
  
  // Split description into sections
  const sections = lowerDescription.split(/\n+/).map(s => s.trim()).filter(Boolean);
  
  const preferredKeywords = ['preferred', 'nice to have', 'bonus', 'plus', 'advantageous'];
  const requiredKeywords = ['required', 'must have', 'essential', 'mandatory'];
  
  const required = new Set();
  const preferred = new Set();
  
  // Find which section each skill belongs to
  allSkills.forEach((skill) => {
    const skillNormalized = normalizeSkillText(skill);
    
    // Check which section this skill is mentioned in
    let foundInRequired = false;
    let foundInPreferred = false;
    
    for (const section of sections) {
      if (section.includes(skillNormalized)) {
        // Look back 200 chars to find context keywords
        const sectionIndex = section.indexOf(skillNormalized);
        const contextStart = Math.max(0, sectionIndex - 200);
        const contextEnd = Math.min(section.length, sectionIndex + 200);
        const context = section.substring(contextStart, contextEnd).toLowerCase();
        
        // Check if this section has preferred keywords
        const hasPreferred = preferredKeywords.some(keyword => context.includes(keyword));
        // Check if this section has required keywords
        const hasRequired = requiredKeywords.some(keyword => context.includes(keyword));
        
        if (hasRequired && !hasPreferred) {
          foundInRequired = true;
        } else if (hasPreferred) {
          foundInPreferred = true;
        }
      }
    }
    
    // If found in both, prefer "required"
    if (foundInRequired) {
      required.add(skill);
    } else if (foundInPreferred) {
      preferred.add(skill);
    } else {
      // Default: if no context markers found, add to required
      required.add(skill);
    }
  });

  // If no skills were categorized, return all as required
  if (required.size === 0 && preferred.size === 0) {
    return { requiredSkills: allSkills, preferredSkills: [], otherRequirements: [] };
  }

  return {
    requiredSkills: Array.from(required).sort((a, b) => a.localeCompare(b)),
    preferredSkills: Array.from(preferred).sort((a, b) => a.localeCompare(b)),
    otherRequirements: [],
  };
};

export const compareSkills = (candidateSkills, requiredSkills, preferredSkills) => {
  const candidateSet = new Set((candidateSkills || []).map((skill) => normalizeSkillName(skill)));
  const requiredSet = new Set((requiredSkills || []).map((skill) => normalizeSkillName(skill)));
  const preferredSet = new Set((preferredSkills || []).map((skill) => normalizeSkillName(skill)));

  const matchedRequired = [];
  const matchedPreferred = [];
  const missingRequired = [];

  for (const requiredSkill of requiredSet) {
    if (candidateSet.has(requiredSkill)) {
      matchedRequired.push(requiredSkill);
    } else {
      missingRequired.push(requiredSkill);
    }
  }

  for (const preferredSkill of preferredSet) {
    if (candidateSet.has(preferredSkill)) {
      matchedPreferred.push(preferredSkill);
    }
  }

  return {
    matchedRequired,
    matchedPreferred,
    missingRequired,
    matchPercentage:
      requiredSet.size > 0 ? Math.round((matchedRequired.length / requiredSet.size) * 100) : 100,
  };
};

/**
 * Extract education from resume text
 * Recognizes common degree patterns and educational qualifications
 */
export const extractEducationFromText = (text) => {
  if (!text || typeof text !== 'string') {
    return null;
  }

  const educationPatterns = [
    // Bachelor's degrees
    /bachelor\s+(?:of|in|of\s+science|of\s+arts|of\s+engineering|of\s+commerce)?[:\s]*([a-z\s&]+?)(?:\n|$|,|;)/i,
    /b\.?\s*(?:tech|a|sc|e|com)[.\s]*(?:in)?[:\s]*([a-z\s&]+?)(?:\n|$|,|;)/i,
    /b\.?s\.?[.\s]*(?:in)?[:\s]*([a-z\s&]+?)(?:\n|$|,|;)/i,
    // Master's degrees
    /master\s+(?:of|in|of\s+science|of\s+arts|of\s+engineering|of\s+commerce)?[:\s]*([a-z\s&]+?)(?:\n|$|,|;)/i,
    /m\.?\s*(?:tech|a|sc|e|com|ba|ca)[.\s]*(?:in)?[:\s]*([a-z\s&]+?)(?:\n|$|,|;)/i,
    /m\.?s\.?[.\s]*(?:in)?[:\s]*([a-z\s&]+?)(?:\n|$|,|;)/i,
    // PhD
    /ph\.?d\.?[.\s]*(?:in)?[:\s]*([a-z\s&]+?)(?:\n|$|,|;)/i,
    /doctor(?:ate)?[.\s]*(?:in)?[:\s]*([a-z\s&]+?)(?:\n|$|,|;)/i,
    // Diploma
    /diploma[.\s]*(?:in)?[:\s]*([a-z\s&]+?)(?:\n|$|,|;)/i,
    // Associate degree
    /associate[.\s]*(?:in)?[:\s]*([a-z\s&]+?)(?:\n|$|,|;)/i,
    // General patterns
    /(?:education|qualification|degree)[:\-]\s*([a-z\s&,]+?)(?:\n|$)/i,
  ];

  const textLower = text.toLowerCase();
  let foundEducation = null;

  for (const pattern of educationPatterns) {
    const match = textLower.match(pattern);
    if (match) {
      foundEducation = match[0]
        .replace(/^[^\w]/g, '')
        .replace(/[,;].*$/g, '')
        .trim();
      
      // Clean up the matched education text
      if (foundEducation.length > 10 && foundEducation.length < 200) {
        break;
      }
    }
  }

  // If no specific degree found, try to extract from education section
  if (!foundEducation) {
    const educationSection = textLower.match(/(?:education|qualifications?|academic)[:\s]*\n?([\s\S]*?)(?:\n(?:experience|skills|projects|certifications)|$)/i);
    if (educationSection && educationSection[1]) {
      const lines = educationSection[1].split('\n').map(l => l.trim()).filter(Boolean);
      if (lines.length > 0) {
        foundEducation = lines[0];
      }
    }
  }

  return foundEducation || null;
};

export default {
  extractSkillsFromText,
  extractSkillsFromJD,
  compareSkills,
  extractEducationFromText,
  SKILL_DATABASE,
};
