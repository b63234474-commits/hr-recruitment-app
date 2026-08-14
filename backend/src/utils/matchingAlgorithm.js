/**
 * Advanced Matching Algorithm Service
 * Calculates comprehensive match scores with weighted criteria
 */

import { extractSkillsFromText, extractSkillsFromJD, compareSkills } from './skillExtractor.js';

const parseExperienceNumber = (experience = '') => {
  if (!experience) return null;
  const match = experience.match(/\d+(\.\d+)?/);
  return match ? parseFloat(match[0]) : null;
};

const extractYearsFromExperience = (expString) => {
  if (!expString) return null;
  const match = expString.match(/(\d+(?:\.\d+)?)\s*(?:\+)?(?:\s*years?)?/i);
  return match ? parseFloat(match[1]) : null;
};

/**
 * Calculate skill match score
 * Weighs required vs preferred skills
 */
const calculateSkillMatch = (candidateSkills, requiredSkills, preferredSkills) => {
  const candidateSet = new Set((candidateSkills || []).map(s => s.toLowerCase().trim()));
  const requiredSet = new Set((requiredSkills || []).map(s => s.toLowerCase().trim()));
  const preferredSet = new Set((preferredSkills || []).map(s => s.toLowerCase().trim()));

  let matchedRequired = 0;
  let matchedPreferred = 0;
  const matchedRequiredList = [];
  const matchedPreferredList = [];
  const missingRequiredList = [];

  // Check required skills
  for (const skill of requiredSet) {
    if (candidateSet.has(skill)) {
      matchedRequired++;
      matchedRequiredList.push(skill);
    } else {
      missingRequiredList.push(skill);
    }
  }

  // Check preferred skills
  for (const skill of preferredSet) {
    if (candidateSet.has(skill)) {
      matchedPreferred++;
      matchedPreferredList.push(skill);
    }
  }

  // Calculate percentages
  const requiredScore = requiredSet.size > 0 ? (matchedRequired / requiredSet.size) * 100 : 100;
  const preferredScore = preferredSet.size > 0 ? (matchedPreferred / preferredSet.size) * 100 : 0;

  // Weight: 75% required, 25% preferred
  const skillScore = (requiredScore * 0.75) + (preferredScore * 0.25);

  return {
    score: Math.round(skillScore),
    requiredScore: Math.round(requiredScore),
    preferredScore: Math.round(preferredScore),
    matchedRequired: matchedRequiredList,
    matchedPreferred: matchedPreferredList,
    missingRequired: missingRequiredList,
    matchedCount: matchedRequired + matchedPreferred,
    totalRequired: requiredSet.size,
    totalPreferred: preferredSet.size,
  };
};

/**
 * Calculate experience match score
 */
const calculateExperienceMatch = (candidateExp, minExp, maxExp) => {
  const candidateYears = extractYearsFromExperience(candidateExp);

  if (candidateYears === null) {
    return {
      score: 0,
      match: false,
      reason: 'Experience not specified in resume',
      candidateExperience: candidateExp || 'Not specified',
      requiredExperience: `${minExp}-${maxExp} years`,
    };
  }

  const minRequired = parseFloat(minExp) || 0;
  const maxRequired = parseFloat(maxExp) || minRequired;

  if (candidateYears >= minRequired && candidateYears <= maxRequired) {
    return {
      score: 100,
      match: true,
      reason: `Candidate has ${candidateYears} years, which matches ${minRequired}-${maxRequired} years requirement`,
      candidateExperience: `${candidateYears} years`,
      requiredExperience: `${minRequired}-${maxRequired} years`,
      percentage: 100,
    };
  }

  if (candidateYears >= minRequired - 1 && candidateYears < minRequired) {
    return {
      score: 75,
      match: true,
      reason: `Candidate has ${candidateYears} years, slightly less than ${minRequired} years required`,
      candidateExperience: `${candidateYears} years`,
      requiredExperience: `${minRequired}-${maxRequired} years`,
      percentage: 75,
    };
  }

  if (candidateYears > maxRequired && candidateYears <= maxRequired + 3) {
    return {
      score: 80,
      match: true,
      reason: `Candidate has ${candidateYears} years, exceeds required range but still relevant`,
      candidateExperience: `${candidateYears} years`,
      requiredExperience: `${minRequired}-${maxRequired} years`,
      percentage: 80,
    };
  }

  if (candidateYears < minRequired - 1) {
    return {
      score: 30,
      match: false,
      reason: `Candidate has ${candidateYears} years, significantly less than ${minRequired} years required`,
      candidateExperience: `${candidateYears} years`,
      requiredExperience: `${minRequired}-${maxRequired} years`,
      percentage: 30,
    };
  }

  return {
    score: 50,
    match: false,
    reason: `Experience mismatch: ${candidateYears} vs ${minRequired}-${maxRequired} required`,
    candidateExperience: `${candidateYears} years`,
    requiredExperience: `${minRequired}-${maxRequired} years`,
    percentage: 50,
  };
};

/**
 * Calculate education match score
 */
const calculateEducationMatch = (candidateEdu, requiredEdu) => {
  if (!requiredEdu) {
    return {
      score: 100,
      match: true,
      reason: 'No specific education requirement',
      candidateEducation: candidateEdu || 'Not specified',
      requiredEducation: 'Not specified',
    };
  }

  if (!candidateEdu) {
    return {
      score: 50,
      match: false,
      reason: 'Education not specified in resume',
      candidateEducation: 'Not specified',
      requiredEducation: requiredEdu,
    };
  }

  const candidateLower = candidateEdu.toLowerCase();
  const requiredLower = requiredEdu.toLowerCase();

  // Exact match or contains
  if (candidateLower.includes(requiredLower) || requiredLower.includes(candidateLower)) {
    return {
      score: 100,
      match: true,
      reason: `Candidate education (${candidateEdu}) matches requirement (${requiredEdu})`,
      candidateEducation: candidateEdu,
      requiredEducation: requiredEdu,
    };
  }

  // Check for common degree types
  const degreeMatch = ['bachelor', 'master', 'phd', 'diploma', 'associate', 'btech', 'mtech', 'bca', 'mca'];
  const candidateDegree = degreeMatch.find(d => candidateLower.includes(d));
  const requiredDegree = degreeMatch.find(d => requiredLower.includes(d));

  if (candidateDegree && requiredDegree && candidateDegree === requiredDegree) {
    return {
      score: 90,
      match: true,
      reason: `Both have ${candidateDegree} level education`,
      candidateEducation: candidateEdu,
      requiredEducation: requiredEdu,
    };
  }

  if (candidateDegree && requiredDegree && candidateDegree > requiredDegree) {
    return {
      score: 85,
      match: true,
      reason: `Candidate has higher education (${candidateEdu}) than required (${requiredEdu})`,
      candidateEducation: candidateEdu,
      requiredEducation: requiredEdu,
    };
  }

  return {
    score: 40,
    match: false,
    reason: `Education mismatch: ${candidateEdu} vs ${requiredEdu}`,
    candidateEducation: candidateEdu,
    requiredEducation: requiredEdu,
  };
};

/**
 * Calculate designation/title relevance
 */
const calculateDesignationMatch = (candidateDesignation, jobTitle) => {
  if (!candidateDesignation || !jobTitle) {
    return {
      score: 50,
      match: false,
      reason: 'Designation or job title not specified',
    };
  }

  const candLower = candidateDesignation.toLowerCase();
  const jobLower = jobTitle.toLowerCase();

  // Exact match
  if (candLower === jobLower) {
    return {
      score: 100,
      match: true,
      reason: `Current designation (${candidateDesignation}) exactly matches job title (${jobTitle})`,
    };
  }

  // Partial match
  if (candLower.includes(jobLower) || jobLower.includes(candLower)) {
    return {
      score: 80,
      match: true,
      reason: `Current designation (${candidateDesignation}) is related to job title (${jobTitle})`,
    };
  }

  // Semantic match - check for common role keywords
  const roles = ['developer', 'engineer', 'architect', 'manager', 'lead', 'senior', 'junior', 'associate'];
  const candRole = roles.find(r => candLower.includes(r));
  const jobRole = roles.find(r => jobLower.includes(r));

  if (candRole && jobRole) {
    if (candRole === jobRole) {
      return {
        score: 70,
        match: true,
        reason: `Both have similar role type (${candRole})`,
      };
    }
    return {
      score: 40,
      match: false,
      reason: `Different role types: ${candRole} vs ${jobRole}`,
    };
  }

  return {
    score: 30,
    match: false,
    reason: `Designation (${candidateDesignation}) seems unrelated to job (${jobTitle})`,
  };
};

/**
 * Main matching algorithm
 * Returns comprehensive match result with weighted scoring
 */
export const calculateMatchScore = (candidate, job) => {
  // Validate inputs
  if (!candidate || !job) {
    throw new Error('Candidate and job data are required');
  }

  // Extract skills from resume (candidate model already has skills array from parsed resume)
  const candidateSkills = candidate.extractedSkills || candidate.skills || [];
  
  // Extract skills from job description
  const jdAnalysis = extractSkillsFromJD(job.jobDescription || '');
  const jobRequiredSkills = job.requiredSkills || jdAnalysis.requiredSkills;
  const jobPreferredSkills = job.preferredSkills || jdAnalysis.preferredSkills;

  // Calculate individual match scores
  const skillMatch = calculateSkillMatch(candidateSkills, jobRequiredSkills, jobPreferredSkills);
  const experienceMatch = calculateExperienceMatch(
    candidate.experience,
    job.minimumExperience,
    job.maximumExperience
  );
  const educationMatch = calculateEducationMatch(candidate.education, job.education);
  const designationMatch = calculateDesignationMatch(candidate.currentDesignation, job.jobTitle);

  // Weights (as per requirements)
  const weights = {
    requiredSkills: 50,
    experience: 25,
    designation: 10,
    education: 5,
    preferredSkills: 10,
  };

  // Calculate weighted overall score
  const overallMatchScore = Math.round(
    (skillMatch.score * weights.requiredSkills +
      experienceMatch.score * weights.experience +
      designationMatch.score * weights.designation +
      educationMatch.score * weights.education) /
      (weights.requiredSkills + weights.experience + weights.designation + weights.education)
  );

  // Determine suitability
  let suitability = 'Not Suitable';
  if (overallMatchScore >= 80) suitability = 'Highly Suitable';
  else if (overallMatchScore >= 65) suitability = 'Suitable';
  else if (overallMatchScore >= 40) suitability = 'Review Required';

  // Combine all matched skills for comprehensive display
  const allMatchedSkills = Array.from(new Set([
    ...skillMatch.matchedRequired,
    ...skillMatch.matchedPreferred
  ]));
  
  // Build matching reasons
  const matchingReasons = [];
  const missingReasons = [];

  if (skillMatch.matchedRequired.length > 0) {
    matchingReasons.push(
      `Has ${skillMatch.matchedRequired.length}/${skillMatch.totalRequired} required skills`
    );
  }
  if (experienceMatch.match) {
    matchingReasons.push(experienceMatch.reason);
  }
  if (educationMatch.match) {
    matchingReasons.push(`Education matches requirement`);
  }

  if (skillMatch.missingRequired.length > 0) {
    missingReasons.push(
      `Missing ${skillMatch.missingRequired.length} required skills: ${skillMatch.missingRequired.slice(0, 3).join(', ')}`
    );
  }
  if (!experienceMatch.match && experienceMatch.score < 50) {
    missingReasons.push(experienceMatch.reason);
  }
  if (!educationMatch.match && educationMatch.score < 50) {
    missingReasons.push(educationMatch.reason);
  }

  // Generate explanation
  const explanation = [
    `Candidate matches ${skillMatch.requiredScore}% of required skills and has ${experienceMatch.percentage || 0}% experience match.`,
    ...matchingReasons,
    missingReasons.length > 0 ? `Areas for improvement: ${missingReasons[0]}` : 'Good overall fit.'
  ].join(' ');

  return {
    overallMatchScore,
    skillMatchScore: skillMatch.score,
    experienceMatchScore: experienceMatch.score,
    designationMatchScore: designationMatch.score,
    educationMatchScore: educationMatch.score,
    suitability,
    
    // Detailed match information
    matchedSkills: allMatchedSkills,
    matchedRequired: skillMatch.matchedRequired,
    matchedPreferred: skillMatch.matchedPreferred,
    missingSkills: skillMatch.missingRequired,
    preferredSkillsMatched: skillMatch.matchedPreferred,
    
    candidateExperience: experienceMatch.candidateExperience,
    requiredExperience: experienceMatch.requiredExperience,
    experienceMatch: experienceMatch.match,
    experienceMatchPercentage: experienceMatch.percentage || 0,
    
    educationMatch: educationMatch.match ? 'Matched' : 'Mismatched',
    candidateEducation: educationMatch.candidateEducation,
    requiredEducation: educationMatch.requiredEducation,
    
    designationRelevance: designationMatch.reason,
    
    explanation,
    matchingReasons,
    missingReasons,
    
    // Additional context
    candidateSkillsExtracted: candidateSkills,
    jobRequiredSkills,
    jobPreferredSkills,
    
    // Scoring weights
    scoringWeights: weights,
  };
};

export default {
  calculateMatchScore,
  calculateSkillMatch,
  calculateExperienceMatch,
  calculateEducationMatch,
  calculateDesignationMatch,
};
