import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { getCandidate, deleteCandidate, sendCandidateEmail, getCandidateEmailHistory } from '../services/candidateService';
import { getInterviews } from '../services/interviewService';
import { getResumeUrl } from '../utils/urlHelper';
import { useAuth } from '../context/AuthContext';
import ActivityTimeline from '../components/ActivityTimeline';

const emailTemplates = {
  'Application Received': {
    subject: 'Application Received - {{jobTitle}}',
    message: `Dear {{candidateName}},\n\nThank you for applying for the {{jobTitle}} position. We have received your application and our recruitment team will review it shortly.\n\nWe will keep you updated on the next steps.\n\nRegards,\n{{recruiterName}}\n{{companyName}}`,
  },
  'Application Shortlisted': {
    subject: 'Application Shortlisted - {{jobTitle}}',
    message: `Dear {{candidateName}},\n\nWe are pleased to let you know that your application for the {{jobTitle}} position has been shortlisted.\n\nWe will contact you with the upcoming steps.\n\nRegards,\n{{recruiterName}}\n{{companyName}}`,
  },
  'Interview Invitation': {
    subject: 'Interview Invitation - {{jobTitle}}',
    message: `Dear {{candidateName}},\n\nWe are pleased to invite you for an interview for the {{jobTitle}} position.\n\nWe will contact you with the interview details.\n\nRegards,\n{{recruiterName}}\n{{companyName}}`,
  },
  'Interview Reminder': {
    subject: 'Interview Reminder - {{jobTitle}}',
    message: `Dear {{candidateName}},\n\nThis is a reminder for your upcoming interview for the {{jobTitle}} position.\n\nWe look forward to speaking with you.\n\nRegards,\n{{recruiterName}}\n{{companyName}}`,
  },
  'Interview Rescheduled': {
    subject: 'Interview Rescheduled - {{jobTitle}}',
    message: `Dear {{candidateName}},\n\nWe would like to inform you that your interview for the {{jobTitle}} position has been rescheduled.\n\nThank you for your understanding.\n\nRegards,\n{{recruiterName}}\n{{companyName}}`,
  },
  Selected: {
    subject: 'Selected for {{jobTitle}}',
    message: `Dear {{candidateName}},\n\nCongratulations! We are pleased to inform you that you have been selected for the {{jobTitle}} position.\n\nOur team will share the next steps with you shortly.\n\nRegards,\n{{recruiterName}}\n{{companyName}}`,
  },
  Rejected: {
    subject: 'Application Status Update - {{jobTitle}}',
    message: `Dear {{candidateName}},\n\nThank you for your interest in the {{jobTitle}} position. After careful consideration, we have decided to move forward with other candidates.\n\nWe appreciate your time and interest.\n\nRegards,\n{{recruiterName}}\n{{companyName}}`,
  },
  'Offer Letter': {
    subject: 'Offer Letter - {{jobTitle}}',
    message: `Dear {{candidateName}},\n\nWe are pleased to offer you the {{jobTitle}} position with {{companyName}}.\n\nWe look forward to welcoming you to the team.\n\nRegards,\n{{recruiterName}}\n{{companyName}}`,
  },
  Onboarding: {
    subject: 'Welcome to {{companyName}}',
    message: `Dear {{candidateName}},\n\nWelcome to {{companyName}}. We are excited to have you join us for the {{jobTitle}} position.\n\nOur onboarding team will guide you through the next steps.\n\nRegards,\n{{recruiterName}}\n{{companyName}}`,
  },
  'Custom Email': {
    subject: '{{jobTitle}} - Update',
    message: `Dear {{candidateName}},\n\nThank you for your continued interest in the {{jobTitle}} position.\n\nWe will keep you updated on the next steps.\n\nRegards,\n{{recruiterName}}\n{{companyName}}`,
  },
};

const templateOptions = Object.keys(emailTemplates);

const buildTemplateContent = (templateName, candidate, user) => {
  const jobTitle = candidate?.appliedJob?.jobTitle || '';
  const companyName = 'HR Recruitment ATS';
  const recruiterName = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'Recruiter';
  const candidateName = [candidate?.firstName, candidate?.lastName].filter(Boolean).join(' ') || 'Candidate';
  const candidateEmail = candidate?.email || '';

  const template = emailTemplates[templateName] || emailTemplates['Custom Email'];
  const subject = template.subject
    .replace(/{{candidateName}}/g, candidateName)
    .replace(/{{candidateEmail}}/g, candidateEmail)
    .replace(/{{jobTitle}}/g, jobTitle)
    .replace(/{{companyName}}/g, companyName)
    .replace(/{{recruiterName}}/g, recruiterName);

  const message = template.message
    .replace(/{{candidateName}}/g, candidateName)
    .replace(/{{candidateEmail}}/g, candidateEmail)
    .replace(/{{jobTitle}}/g, jobTitle)
    .replace(/{{companyName}}/g, companyName)
    .replace(/{{recruiterName}}/g, recruiterName);

  return { subject, message };
};

const formatDate = (value) => {
  if (!value) return '-';
  return new Date(value).toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const CandidateDetails = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [candidate, setCandidate] = useState(null);
  const [interviews, setInterviews] = useState([]);
  const [emailHistory, setEmailHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [emailNotice, setEmailNotice] = useState('');
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailForm, setEmailForm] = useState({
    to: '',
    template: 'Application Received',
    subject: '',
    message: '',
  });
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailFeedback, setEmailFeedback] = useState('');
  const navigate = useNavigate();

  const candidateName = useMemo(
    () => [candidate?.firstName, candidate?.lastName].filter(Boolean).join(' ') || 'Candidate',
    [candidate]
  );

  const loadEmailHistory = async () => {
    try {
      const response = await getCandidateEmailHistory(id);
      setEmailHistory(response.data.data.history || []);
    } catch (err) {
      console.error('Unable to load email history', err);
    }
  };

  useEffect(() => {
    const loadCandidate = async () => {
      setLoading(true);
      try {
        const response = await getCandidate(id);
        setCandidate(response.data.data.candidate);
        const interviewsResponse = await getInterviews({ candidate: id, limit: 50 });
        setInterviews(interviewsResponse.data.data.interviews);
        await loadEmailHistory();
      } catch (err) {
        setError(err.response?.data?.message || 'Unable to load candidate');
      } finally {
        setLoading(false);
      }
    };
    loadCandidate();
  }, [id]);

  const handleDelete = async () => {
    if (!window.confirm('Delete this candidate?')) return;
    try {
      await deleteCandidate(id);
      navigate('/candidates');
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to delete candidate');
    }
  };

  const openEmailModal = () => {
    if (!candidate?.email) {
      setEmailNotice('This candidate does not have an email address.');
      return;
    }

    setEmailNotice('');
    const nextTemplate = 'Application Received';
    const content = buildTemplateContent(nextTemplate, candidate, user);
    setEmailForm({
      to: candidate.email,
      template: nextTemplate,
      subject: content.subject,
      message: content.message,
    });
    setEmailFeedback('');
    setShowEmailModal(true);
  };

  const handleTemplateChange = (templateName) => {
    const content = buildTemplateContent(templateName, candidate, user);
    setEmailForm((prev) => ({
      ...prev,
      template: templateName,
      subject: content.subject,
      message: content.message,
    }));
  };

  const handleSendEmail = async () => {
    if (!candidate?.email) {
      setEmailNotice('This candidate does not have an email address.');
      setShowEmailModal(false);
      return;
    }

    const trimmedSubject = emailForm.subject.trim();
    const trimmedMessage = emailForm.message.trim();

    if (!trimmedSubject || !trimmedMessage) {
      setEmailFeedback('Subject and message are required.');
      return;
    }

    try {
      setSendingEmail(true);
      setEmailFeedback('');
      await sendCandidateEmail({
        candidateId: candidate._id,
        to: emailForm.to || candidate.email,
        subject: trimmedSubject,
        message: trimmedMessage,
        template: emailForm.template,
      });
      setEmailFeedback(`Email sent successfully to ${candidate.email}`);
      setShowEmailModal(false);
      await loadEmailHistory();
    } catch (err) {
      setEmailFeedback('Failed to send email. Please try again.');
    } finally {
      setSendingEmail(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status"></div>
      </div>
    );
  }

  if (error) {
    return <div className="alert alert-danger">{error}</div>;
  }

  if (!candidate) {
    return <div className="alert alert-warning">Candidate not found.</div>;
  }

  return (
    <div className="container-fluid px-4 py-4">
      {emailNotice && <div className="alert alert-warning">{emailNotice}</div>}
      {emailFeedback && (
        <div className={`alert ${emailFeedback.includes('successfully') ? 'alert-success' : 'alert-danger'}`}>
          {emailFeedback}
        </div>
      )}

      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start gap-3 mb-4">
        <div className="d-flex align-items-center gap-3">
          {candidate.imageUrl ? (
            <img
              src={getResumeUrl(candidate.imageUrl)}
              alt={`${candidate.firstName} ${candidate.lastName}`}
              className="rounded-circle border"
              style={{ width: 72, height: 72, objectFit: 'cover' }}
            />
          ) : (
            <div
              className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center"
              style={{ width: 72, height: 72 }}
            >
              <span className="fs-3 fw-bold">
                {candidate.firstName?.[0] || 'C'}{candidate.lastName?.[0] || ''}
              </span>
            </div>
          )}
          <div>
            <h3 className="mb-1">{candidateName}</h3>
            <p className="text-muted mb-2">{candidate.currentDesignation || 'Candidate profile'}</p>
            <div className="d-flex flex-wrap gap-2">
              <span className="badge bg-secondary">{candidate.status || 'Active'}</span>
              <span className="badge bg-info text-dark">{candidate.source || 'Unknown source'}</span>
              <span className="badge bg-light text-dark">{candidate.experience || 'Experience N/A'}</span>
            </div>
          </div>
        </div>

        <div className="d-flex flex-wrap gap-2">
          <button
            type="button"
            className="btn btn-primary"
            style={{ backgroundColor: '#6f42c1', borderColor: '#6f42c1' }}
            onClick={openEmailModal}
          >
            <i className="bi bi-envelope me-2"></i>
            Send Email
          </button>
          <button type="button" className="btn btn-success" onClick={() => navigate('/candidates')}>
            OK
          </button>
          <Link to={`/candidates/${id}/edit`} className="btn btn-outline-secondary">
            Edit
          </Link>
          <button className="btn btn-danger" onClick={handleDelete}>
            Delete
          </button>
        </div>
      </div>

      <div className="row g-4">
        <div className="col-lg-12">
          <div className="card mb-4 shadow-sm">
            <div className="card-body">
              <h5 className="card-title">Contact Information</h5>
              <div className="row g-4">
                <div className="col-sm-6">
                  <div className="small text-uppercase text-muted mb-1">Email</div>
                  <p className="mb-0">{candidate.email ? <a href={`mailto:${candidate.email}`}>{candidate.email}</a> : '-'}</p>
                </div>
                <div className="col-sm-6">
                  <div className="small text-uppercase text-muted mb-1">Phone</div>
                  <p className="mb-0">{candidate.phone || '-'}</p>
                </div>
                <div className="col-sm-6">
                  <div className="small text-uppercase text-muted mb-1">Location</div>
                  <p className="mb-0">{candidate.location || '-'}</p>
                </div>
                <div className="col-sm-6">
                  <div className="small text-uppercase text-muted mb-1">Applied Job</div>
                  <p className="mb-0">
                    {candidate.appliedJob?.jobTitle || candidate.appliedJob?.jobId || '-'}
                    {candidate.appliedJob?.jobTitle && candidate.appliedJob?.jobId ? (
                      <span className="text-muted"> ({candidate.appliedJob.jobId})</span>
                    ) : null}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="card mb-4 shadow-sm">
            <div className="card-body">
              <h5 className="card-title">Background</h5>
              <div className="row g-4">
                <div className="col-sm-6">
                  <div className="small text-uppercase text-muted mb-1">Experience</div>
                  <p className="mb-0">{candidate.experience || '-'}</p>
                </div>
                <div className="col-sm-6">
                  <div className="small text-uppercase text-muted mb-1">Current Company</div>
                  <p className="mb-0">{candidate.currentCompany || '-'}</p>
                </div>
                <div className="col-sm-6">
                  <div className="small text-uppercase text-muted mb-1">Designation</div>
                  <p className="mb-0">{candidate.currentDesignation || '-'}</p>
                </div>
                <div className="col-sm-6">
                  <div className="small text-uppercase text-muted mb-1">Source</div>
                  <p className="mb-0">{candidate.source || '-'}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="card mb-4 shadow-sm">
            <div className="card-body">
              <h5 className="card-title">Resume</h5>
              <p className="mb-3">{candidate.resumeFilename || 'Not uploaded'}</p>
              {candidate.resumeUrl && (
                <a href={getResumeUrl(candidate.resumeUrl)} target="_blank" rel="noreferrer" className="btn btn-sm btn-outline-primary">
                  <i className="bi bi-download me-1"></i>Download Resume
                </a>
              )}
            </div>
          </div>

          <div className="card mb-4 shadow-sm">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center mb-3 gap-3 flex-column flex-sm-row">
                <div>
                  <h5 className="card-title mb-1">Assessments</h5>
                  <p className="small text-muted mb-0">Assigned assessments for this candidate.</p>
                </div>
                <Link to={`/assessments/create?candidateId=${candidate._id}`} className="btn btn-sm btn-primary">
                  Assign Assessment
                </Link>
              </div>
              {candidate.assessments && candidate.assessments.length > 0 ? (
                <ul className="list-group list-group-flush">
                  {candidate.assessments.map((assessment) => (
                    <li key={assessment._id} className="list-group-item d-flex justify-content-between align-items-center">
                      <div>
                        <strong>{assessment.title}</strong>
                        <div className="small text-muted">{assessment.assessmentType} • {assessment.status}</div>
                      </div>
                      <Link to={`/assessments/${assessment._id}`} className="btn btn-sm btn-outline-secondary">
                        View
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-muted">No assessments assigned yet.</div>
              )}
            </div>
          </div>

          <div className="card mb-4 shadow-sm">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center mb-3 gap-3 flex-column flex-sm-row">
                <div>
                  <h5 className="card-title mb-1">📧 Email History</h5>
                  <p className="small text-muted mb-0">Recent communication with this candidate.</p>
                </div>
              </div>
              {emailHistory.length > 0 ? (
                <div className="table-responsive">
                  <table className="table table-sm align-middle mb-0">
                    <thead className="table-light">
                      <tr>
                        <th>Date</th>
                        <th>Subject</th>
                        <th>Template</th>
                        <th>Sent By</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {emailHistory.map((entry) => (
                        <tr key={entry._id}>
                          <td>{formatDate(entry.sentAt)}</td>
                          <td>{entry.subject || '-'}</td>
                          <td>{entry.template || 'Custom Email'}</td>
                          <td>{entry.sentBy ? `${entry.sentBy.firstName || ''} ${entry.sentBy.lastName || ''}`.trim() : 'System'}</td>
                          <td>
                            <span className={`badge ${entry.status === 'Sent' ? 'bg-success' : 'bg-danger'}`}>
                              {entry.status || 'Sent'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-muted">No email history yet.</div>
              )}
            </div>
          </div>

          <div className="card shadow-sm">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center mb-3 gap-3 flex-column flex-sm-row">
                <div>
                  <h5 className="card-title mb-1">Interviews</h5>
                  <p className="small text-muted mb-0">Scheduled interviews tied to this candidate.</p>
                </div>
                <Link to={`/interviews/create?candidateId=${candidate._id}`} className="btn btn-sm btn-primary">
                  Schedule Interview
                </Link>
              </div>
              {interviews.length > 0 ? (
                <ul className="list-group list-group-flush">
                  {interviews.map((interview) => (
                    <li key={interview._id} className="list-group-item d-flex justify-content-between align-items-center">
                      <div>
                        <strong>{interview.interviewType}</strong>
                        <div className="small text-muted">{new Date(interview.interviewDate).toLocaleString()} • {interview.status}</div>
                      </div>
                      <Link to={`/interviews/${interview._id}`} className="btn btn-sm btn-outline-secondary">
                        View
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-muted">No interviews scheduled yet.</div>
              )}
            </div>
          </div>

          <ActivityTimeline candidateId={candidate._id} />
        </div>
      </div>

      {showEmailModal && (
        <div className="modal fade show d-block" tabIndex="-1" role="dialog" style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}>
          <div className="modal-dialog modal-lg modal-dialog-centered" role="document">
            <div className="modal-content">
              <div className="modal-header" style={{ backgroundColor: '#6f42c1', color: '#fff' }}>
                <h5 className="modal-title">Send Email</h5>
                <button type="button" className="btn-close btn-close-white" aria-label="Close" onClick={() => setShowEmailModal(false)}></button>
              </div>
              <div className="modal-body">
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label">To</label>
                    <input
                      type="email"
                      className="form-control"
                      value={emailForm.to}
                      onChange={(e) => setEmailForm((prev) => ({ ...prev, to: e.target.value }))}
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Candidate</label>
                    <input className="form-control" value={candidateName} readOnly />
                  </div>
                  <div className="col-md-12">
                    <label className="form-label">Email Template</label>
                    <select
                      className="form-select"
                      value={emailForm.template}
                      onChange={(e) => handleTemplateChange(e.target.value)}
                    >
                      {templateOptions.map((item) => (
                        <option key={item} value={item}>{item}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-12">
                    <label className="form-label">Subject</label>
                    <input
                      type="text"
                      className="form-control"
                      value={emailForm.subject}
                      onChange={(e) => setEmailForm((prev) => ({ ...prev, subject: e.target.value }))}
                    />
                  </div>
                  <div className="col-md-12">
                    <label className="form-label">Message</label>
                    <textarea
                      className="form-control"
                      rows="8"
                      value={emailForm.message}
                      onChange={(e) => setEmailForm((prev) => ({ ...prev, message: e.target.value }))}
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline-secondary" onClick={() => setShowEmailModal(false)}>
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  style={{ backgroundColor: '#6f42c1', borderColor: '#6f42c1' }}
                  disabled={sendingEmail}
                  onClick={handleSendEmail}
                >
                  {sendingEmail ? 'Sending...' : 'Send Email'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CandidateDetails;
