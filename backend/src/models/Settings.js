import mongoose from 'mongoose';
import { DEFAULT_SETTINGS } from '../config/defaultSettings.js';

const settingsSchema = new mongoose.Schema(
  {
    general: {
      companyName: { type: String, default: DEFAULT_SETTINGS.general.companyName },
      companyEmail: { type: String, default: DEFAULT_SETTINGS.general.companyEmail },
      companyPhone: { type: String, default: DEFAULT_SETTINGS.general.companyPhone },
      timezone: { type: String, default: DEFAULT_SETTINGS.general.timezone },
      dateFormat: { type: String, default: DEFAULT_SETTINGS.general.dateFormat },
      defaultLanguage: { type: String, default: DEFAULT_SETTINGS.general.defaultLanguage },
    },
    company: {
      website: { type: String, default: DEFAULT_SETTINGS.company.website },
      address: { type: String, default: DEFAULT_SETTINGS.company.address },
      city: { type: String, default: DEFAULT_SETTINGS.company.city },
      country: { type: String, default: DEFAULT_SETTINGS.company.country },
      logoUrl: { type: String, default: DEFAULT_SETTINGS.company.logoUrl },
    },
    usersAndRoles: {
      signupEnabled: { type: Boolean, default: DEFAULT_SETTINGS.usersAndRoles.signupEnabled },
      requireTwoFactor: { type: Boolean, default: DEFAULT_SETTINGS.usersAndRoles.requireTwoFactor },
      defaultRole: { type: String, default: DEFAULT_SETTINGS.usersAndRoles.defaultRole },
      sessionTimeoutMinutes: { type: Number, default: DEFAULT_SETTINGS.usersAndRoles.sessionTimeoutMinutes },
    },
    recruitment: {
      autoAssignCandidateStatus: { type: Boolean, default: DEFAULT_SETTINGS.recruitment.autoAssignCandidateStatus },
      candidateStatusOnApply: { type: String, default: DEFAULT_SETTINGS.recruitment.candidateStatusOnApply },
      jobPostingApproval: { type: Boolean, default: DEFAULT_SETTINGS.recruitment.jobPostingApproval },
      resumeParsingEnabled: { type: Boolean, default: DEFAULT_SETTINGS.recruitment.resumeParsingEnabled },
      candidateAutoMatch: { type: Boolean, default: DEFAULT_SETTINGS.recruitment.candidateAutoMatch },
      defaultSource: { type: String, default: DEFAULT_SETTINGS.recruitment.defaultSource },
      allowMultipleApplications: { type: Boolean, default: DEFAULT_SETTINGS.recruitment.allowMultipleApplications },
    },
    jobs: {
      defaultJobStatus: { type: String, default: DEFAULT_SETTINGS.jobs.defaultJobStatus },
      allowDraftPublishing: { type: Boolean, default: DEFAULT_SETTINGS.jobs.allowDraftPublishing },
      jobExpirationDays: { type: Number, default: DEFAULT_SETTINGS.jobs.jobExpirationDays },
      maxOpeningsPerJob: { type: Number, default: DEFAULT_SETTINGS.jobs.maxOpeningsPerJob },
    },
    candidates: {
      defaultCandidateStatus: { type: String, default: DEFAULT_SETTINGS.candidates.defaultCandidateStatus },
      allowDuplicateEmails: { type: Boolean, default: DEFAULT_SETTINGS.candidates.allowDuplicateEmails },
      showCandidateImages: { type: Boolean, default: DEFAULT_SETTINGS.candidates.showCandidateImages },
      allowManualSkillEdit: { type: Boolean, default: DEFAULT_SETTINGS.candidates.allowManualSkillEdit },
    },
    ats: {
      skillWeight: { type: Number, default: DEFAULT_SETTINGS.ats.skillWeight },
      experienceWeight: { type: Number, default: DEFAULT_SETTINGS.ats.experienceWeight },
      educationWeight: { type: Number, default: DEFAULT_SETTINGS.ats.educationWeight },
      locationWeight: { type: Number, default: DEFAULT_SETTINGS.ats.locationWeight },
      minMatchScore: { type: Number, default: DEFAULT_SETTINGS.ats.minMatchScore },
      highlightTopMatches: { type: Number, default: DEFAULT_SETTINGS.ats.highlightTopMatches },
      stripStopWords: { type: Boolean, default: DEFAULT_SETTINGS.ats.stripStopWords },
    },
    interviews: {
      defaultDuration: { type: Number, default: DEFAULT_SETTINGS.interviews.defaultDuration },
      reminderEmails: { type: Boolean, default: DEFAULT_SETTINGS.interviews.reminderEmails },
      reminderBeforeHours: { type: Number, default: DEFAULT_SETTINGS.interviews.reminderBeforeHours },
      interviewerAssignmentMode: { type: String, default: DEFAULT_SETTINGS.interviews.interviewerAssignmentMode },
    },
    email: {
      sendGridEnabled: { type: Boolean, default: DEFAULT_SETTINGS.email.sendGridEnabled },
      defaultFromName: { type: String, default: DEFAULT_SETTINGS.email.defaultFromName },
      defaultFromEmail: { type: String, default: DEFAULT_SETTINGS.email.defaultFromEmail },
      emailSignature: { type: String, default: DEFAULT_SETTINGS.email.emailSignature },
    },
    notifications: {
      inAppAlerts: { type: Boolean, default: DEFAULT_SETTINGS.notifications.inAppAlerts },
      emailDigest: { type: Boolean, default: DEFAULT_SETTINGS.notifications.emailDigest },
      slackWebhook: { type: String, default: DEFAULT_SETTINGS.notifications.slackWebhook },
      teamsWebhook: { type: String, default: DEFAULT_SETTINGS.notifications.teamsWebhook },
    },
    integrations: {
      atsApiEnabled: { type: Boolean, default: DEFAULT_SETTINGS.integrations.atsApiEnabled },
      syncFrequency: { type: String, default: DEFAULT_SETTINGS.integrations.syncFrequency },
      apiKey: { type: String, default: DEFAULT_SETTINGS.integrations.apiKey },
      webhookSecret: { type: String, default: DEFAULT_SETTINGS.integrations.webhookSecret },
    },
    careers: {
      publicWebsiteEnabled: { type: Boolean, default: DEFAULT_SETTINGS.careers.publicWebsiteEnabled },
      careersUrl: { type: String, default: DEFAULT_SETTINGS.careers.careersUrl },
      allowApplyOffline: { type: Boolean, default: DEFAULT_SETTINGS.careers.allowApplyOffline },
      thankYouMessage: { type: String, default: DEFAULT_SETTINGS.careers.thankYouMessage },
    },
    customFields: {
      enabled: { type: Boolean, default: DEFAULT_SETTINGS.customFields.enabled },
      fields: [{ type: mongoose.Schema.Types.Mixed, default: [] }],
    },
    security: {
      sessionTimeoutMinutes: { type: Number, default: DEFAULT_SETTINGS.security.sessionTimeoutMinutes },
      passwordPolicy: { type: String, default: DEFAULT_SETTINGS.security.passwordPolicy },
      allowGuestAccess: { type: Boolean, default: DEFAULT_SETTINGS.security.allowGuestAccess },
      auditLogs: { type: Boolean, default: DEFAULT_SETTINGS.security.auditLogs },
    },
    privacy: {
      dataRetentionDays: { type: Number, default: DEFAULT_SETTINGS.privacy.dataRetentionDays },
      anonymizeRejectedCandidates: { type: Boolean, default: DEFAULT_SETTINGS.privacy.anonymizeRejectedCandidates },
      consentRequired: { type: Boolean, default: DEFAULT_SETTINGS.privacy.consentRequired },
      exportEnabled: { type: Boolean, default: DEFAULT_SETTINGS.privacy.exportEnabled },
    },
    storage: {
      uploadLimitMB: { type: Number, default: DEFAULT_SETTINGS.storage.uploadLimitMB },
      allowedResumeTypes: { type: [String], default: DEFAULT_SETTINGS.storage.allowedResumeTypes },
      uploadFolder: { type: String, default: DEFAULT_SETTINGS.storage.uploadFolder },
    },
    audit: {
      logUserActions: { type: Boolean, default: DEFAULT_SETTINGS.audit.logUserActions },
      logAdminChanges: { type: Boolean, default: DEFAULT_SETTINGS.audit.logAdminChanges },
      retentionDays: { type: Number, default: DEFAULT_SETTINGS.audit.retentionDays },
    },
  },
  {
    timestamps: true,
  }
);

settingsSchema.methods.toJSON = function () {
  const settings = this.toObject();
  delete settings.__v;
  return settings;
};

const Settings = mongoose.model('Settings', settingsSchema);

export default Settings;
