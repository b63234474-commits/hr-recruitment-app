export const DEFAULT_SETTINGS = {
  general: {
    companyName: 'HR Recruitment ATS',
    companyEmail: 'hr@company.com',
    companyPhone: '',
    timezone: 'UTC',
    dateFormat: 'DD/MM/YYYY',
    defaultLanguage: 'English',
  },
  company: {
    website: '',
    address: '',
    city: '',
    country: 'India',
    logoUrl: '',
  },
  usersAndRoles: {
    signupEnabled: true,
    requireTwoFactor: false,
    defaultRole: 'Recruiter',
    sessionTimeoutMinutes: 60,
  },
  recruitment: {
    autoAssignCandidateStatus: true,
    candidateStatusOnApply: 'New',
    jobPostingApproval: false,
    resumeParsingEnabled: true,
    candidateAutoMatch: true,
    defaultSource: 'LinkedIn',
    allowMultipleApplications: false,
  },
  jobs: {
    defaultJobStatus: 'Draft',
    allowDraftPublishing: true,
    jobExpirationDays: 90,
    maxOpeningsPerJob: 10,
  },
  candidates: {
    defaultCandidateStatus: 'New',
    allowDuplicateEmails: false,
    showCandidateImages: true,
    allowManualSkillEdit: false,
  },
  ats: {
    skillWeight: 40,
    experienceWeight: 25,
    educationWeight: 15,
    locationWeight: 20,
    minMatchScore: 70,
    highlightTopMatches: 5,
    stripStopWords: true,
  },
  interviews: {
    defaultDuration: 45,
    reminderEmails: true,
    reminderBeforeHours: 24,
    interviewerAssignmentMode: 'Manual',
  },
  email: {
    sendGridEnabled: false,
    defaultFromName: 'HR ATS',
    defaultFromEmail: 'noreply@company.com',
    emailSignature: '',
  },
  notifications: {
    inAppAlerts: true,
    emailDigest: true,
    slackWebhook: '',
    teamsWebhook: '',
  },
  integrations: {
    atsApiEnabled: false,
    syncFrequency: 'Daily',
    apiKey: '',
    webhookSecret: '',
  },
  careers: {
    publicWebsiteEnabled: false,
    careersUrl: '',
    allowApplyOffline: false,
    thankYouMessage: 'Thank you for applying. Our team will reach out soon.',
  },
  customFields: {
    enabled: false,
    fields: [],
  },
  security: {
    sessionTimeoutMinutes: 60,
    passwordPolicy: 'Strong',
    allowGuestAccess: false,
    auditLogs: true,
  },
  privacy: {
    dataRetentionDays: 365,
    anonymizeRejectedCandidates: false,
    consentRequired: true,
    exportEnabled: true,
  },
  storage: {
    uploadLimitMB: 25,
    allowedResumeTypes: ['pdf', 'doc', 'docx'],
    uploadFolder: 'uploads',
  },
  audit: {
    logUserActions: true,
    logAdminChanges: true,
    retentionDays: 180,
  },
};

export const buildDefaultSettings = () => ({
  ...DEFAULT_SETTINGS,
  updatedAt: new Date(),
  createdAt: new Date(),
});

export const normalizeSettings = (input = {}) => {
  const merged = JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
  const deepMerge = (target, source) => {
    Object.keys(source || {}).forEach((key) => {
      const sourceValue = source[key];
      const targetValue = target[key];

      if (Array.isArray(sourceValue)) {
        target[key] = Array.isArray(targetValue) ? targetValue : [...sourceValue];
      } else if (sourceValue && typeof sourceValue === 'object' && !Array.isArray(sourceValue)) {
        target[key] = targetValue && typeof targetValue === 'object' ? deepMerge(targetValue, sourceValue) : JSON.parse(JSON.stringify(sourceValue));
      } else {
        target[key] = targetValue ?? sourceValue;
      }
    });

    return target;
  };

  return deepMerge(merged, input);
};
