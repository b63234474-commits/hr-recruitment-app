import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { getJob } from '../services/jobService';
import { getMatchingCandidates, getCandidateMatch, saveCandidateMatch, updateCandidateStatus } from '../services/matchService';
import Layout from '../components/Layout';
import { getResumeUrl } from '../utils/urlHelper';

const EXPERIENCE_OPTIONS = [
  { value: '', label: 'All' },
  { value: '0-1', label: '0–1' },
  { value: '1-2', label: '1–2' },
  { value: '2-3', label: '2–3' },
  { value: '3-5', label: '3–5' },
  { value: '5+', label: '5+' },
];

const RESULT_OPTIONS = [
  { value: '', label: 'All' },
  { value: 'Highly Suitable', label: 'Highly Suitable' },
  { value: 'Suitable', label: 'Suitable' },
  { value: 'Review Required', label: 'Review Required' },
  { value: 'Not Suitable', label: 'Not Suitable' },
];

const getSuitabilityColor = (suitability) => {
  switch (suitability) {
    case 'Highly Suitable':
      return 'success';
    case 'Suitable':
      return 'info';
    case 'Review Required':
      return 'warning';
    case 'Not Suitable':
      return 'danger';
    default:
      return 'secondary';
  }
};

const getScoreColor = (score) => {
  if (score >= 80) return 'success';
  if (score >= 65) return 'info';
  if (score >= 40) return 'warning';
  return 'danger';
};

const JobMatchCandidates = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    search: '',
    experience: '',
    result: '',
    sortBy: 'score',
  });
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [candidateMatchDetails, setCandidateMatchDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const filteredCandidates = useMemo(() => candidates, [candidates]);

  const averageScore = useMemo(() => {
    if (candidates.length === 0) return 0;
    const total = candidates.reduce((sum, c) => sum + (c.matchScore || 0), 0);
    return Math.round(total / candidates.length);
  }, [candidates]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError('');
      try {
        const [jobRes, candidatesRes] = await Promise.all([
          getJob(id),
          getMatchingCandidates(id, filters),
        ]);
        setJob(jobRes.data.data.job);
        // Sort by score descending by default
        const sorted = [...(candidatesRes.data.data.candidates || [])].sort(
          (a, b) => (b.matchScore || 0) - (a.matchScore || 0)
        );
        setCandidates(sorted);
      } catch (err) {
        setError(err.response?.data?.message || 'Unable to load match data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id, filters]);

  const handleFilterChange = (name, value) => {
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const openMatchDetails = async (candidate) => {
    setSelectedCandidate(candidate);
    setCandidateMatchDetails(null);
    setDetailsLoading(true);
    try {
      const response = await getCandidateMatch(id, candidate._id);
      setCandidateMatchDetails(response.data.data);
      await saveCandidateMatch(id, candidate._id);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load match details');
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleStatusUpdate = async (candidateId, status) => {
    setActionLoading(true);
    setError('');
    try {
      const response = await updateCandidateStatus(candidateId, { status });
      const updatedStatus = response.data.data.candidate.status;
      setCandidates((prev) =>
        prev.map((item) =>
          item._id === candidateId ? { ...item, status: updatedStatus } : item
        )
      );
      if (selectedCandidate?._id === candidateId) {
        setSelectedCandidate((prev) =>
          prev ? { ...prev, status: updatedStatus } : prev
        );
        setCandidateMatchDetails((prev) =>
          prev
            ? {
                ...prev,
                candidate: {
                  ...prev.candidate,
                  status: updatedStatus,
                },
              }
            : prev
        );
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to update status');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status"></div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="alert alert-danger">{error}</div>
      </Layout>
    );
  }

  if (!job) {
    return (
      <Layout>
        <div className="alert alert-warning">Job not found.</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start gap-3 mb-4">
        <div>
          <h3 className="mb-1">Match Candidates</h3>
          <p className="text-muted mb-0">AI-powered candidate-to-job matching with detailed analysis</p>
        </div>
        <button className="btn btn-outline-secondary" onClick={() => navigate(`/jobs/${id}`)}>
          <i className="bi bi-arrow-left me-1"></i>Back
        </button>
      </div>

      {/* Job Summary Card */}
      <div className="card mb-4 shadow-sm">
        <div className="card-body">
          <div className="row g-3 align-items-center">
            <div className="col-md-3">
              <small className="text-uppercase text-muted">Job ID</small>
              <p className="fw-semibold mb-0">{job.jobId}</p>
              <small className="text-muted">{job.department}</small>
            </div>
            <div className="col-md-3">
              <small className="text-uppercase text-muted">Job Title</small>
              <p className="fw-semibold mb-0">{job.jobTitle}</p>
            </div>
            <div className="col-md-3">
              <small className="text-uppercase text-muted">Experience Required</small>
              <p className="fw-semibold mb-0">{job.minimumExperience}–{job.maximumExperience} years</p>
            </div>
            <div className="col-md-3">
              <small className="text-uppercase text-muted">Total Candidates</small>
              <p className="fw-semibold mb-0">{filteredCandidates.length}</p>
            </div>
            <div className="col-md-3">
              <small className="text-uppercase text-muted">Average Match Score</small>
              <p className="fw-semibold mb-0">
                <span className={`text-${getScoreColor(averageScore)}`}>{averageScore}%</span>
              </p>
            </div>
          </div>

          <hr />

          <div>
            <small className="text-uppercase text-muted d-block mb-2">Required Skills</small>
            <div className="d-flex flex-wrap gap-2">
              {job.requiredSkills?.length > 0 ? (
                job.requiredSkills.slice(0, 10).map((skill) => (
                  <span key={skill} className="badge bg-primary">{skill}</span>
                ))
              ) : (
                <span className="text-muted small">None specified</span>
              )}
              {job.requiredSkills?.length > 10 && (
                <span className="badge bg-secondary">+{job.requiredSkills.length - 10} more</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Filters Card */}
      <div className="card mb-4 shadow-sm">
        <div className="card-body">
          <div className="row g-3 align-items-end">
            <div className="col-md-4">
              <label className="form-label fw-semibold">Search Candidate</label>
              <input
                type="text"
                className="form-control"
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                placeholder="Name, designation, location..."
              />
            </div>
            <div className="col-md-2">
              <label className="form-label fw-semibold">Experience</label>
              <select
                className="form-select"
                value={filters.experience}
                onChange={(e) => handleFilterChange('experience', e.target.value)}
              >
                {EXPERIENCE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
            <div className="col-md-2">
              <label className="form-label fw-semibold">Suitability</label>
              <select
                className="form-select"
                value={filters.result}
                onChange={(e) => handleFilterChange('result', e.target.value)}
              >
                {RESULT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
            <div className="col-md-2">
              <label className="form-label fw-semibold">Sort By</label>
              <select
                className="form-select"
                value={filters.sortBy}
                onChange={(e) => handleFilterChange('sortBy', e.target.value)}
              >
                <option value="score">Match Score</option>
                <option value="name">Candidate Name</option>
                <option value="experience">Experience</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {filteredCandidates.length === 0 ? (
        <div className="card text-center">
          <div className="card-body py-5">
            <i className="bi bi-inbox text-muted" style={{ fontSize: '3rem' }}></i>
            <h5 className="card-title mt-3">No candidates found</h5>
            <p className="card-text text-muted">No candidates match the selected filters or there are no uploaded resumes.</p>
            <Link to="/candidates/create" className="btn btn-primary">
              <i className="bi bi-plus-circle me-1"></i>Add Candidate
            </Link>
          </div>
        </div>
      ) : (
        <div className="row g-3 mb-4">
          {filteredCandidates.map((candidate) => (
            <div key={candidate._id} className="col-12">
              <div className="card shadow-sm">
                <div className="card-body">
                  <div className="row align-items-center">
                    <div className="col-md-4">
                      <div>
                        <h6 className="mb-1">{candidate.firstName} {candidate.lastName}</h6>
                        <small className="text-muted">{candidate.currentDesignation || 'N/A'}</small>
                        <br />
                        <small className="text-muted">{candidate.email || candidate.location || 'No contact'}</small>
                      </div>
                    </div>
                    <div className="col-md-2 text-center">
                      <div>
                        <small className="text-uppercase text-muted d-block mb-1">Match Score</small>
                        <div className={`text-${getScoreColor(candidate.matchScore)} fw-bold`} style={{ fontSize: '1.75rem' }}>
                          {candidate.matchScore || 0}%
                        </div>
                      </div>
                    </div>
                    <div className="col-md-2 text-center">
                      <div>
                        <small className="text-uppercase text-muted d-block mb-1">Status</small>
                        <span className={`badge bg-${getSuitabilityColor(candidate.result)}`}>
                          {candidate.result || 'Review Required'}
                        </span>
                      </div>
                    </div>
                    <div className="col-md-2 text-center">
                      <div>
                        <small className="text-uppercase text-muted d-block mb-1">Experience</small>
                        <p className="mb-0 fw-semibold">{candidate.experience || 'N/A'}</p>
                      </div>
                    </div>
                    <div className="col-md-2 text-center">
                      <button
                        className="btn btn-sm btn-primary"
                        onClick={() => openMatchDetails(candidate)}
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Match Details Modal */}
      {selectedCandidate && (
        <div className="card shadow-lg">
          <div className="card-header bg-primary text-white">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <h5 className="mb-0">Match Analysis</h5>
                <small>{selectedCandidate.firstName} {selectedCandidate.lastName} vs {job.jobTitle}</small>
              </div>
              <button
                type="button"
                className="btn-close btn-close-white"
                onClick={() => setSelectedCandidate(null)}
              ></button>
            </div>
          </div>
          <div className="card-body">
            {detailsLoading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status"></div>
                <p className="mt-2">Analyzing match...</p>
              </div>
            ) : candidateMatchDetails ? (
              <>
                {/* Overall Score */}
                <div className="alert alert-light border mb-4">
                  <div className="row align-items-center">
                    <div className="col-md-3 text-center border-md-end">
                      <div className={`text-${getScoreColor(candidateMatchDetails.match.overallMatchScore)}`}>
                        <div style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>
                          {candidateMatchDetails.match.overallMatchScore || candidateMatchDetails.match.score || 0}%
                        </div>
                        <div className="fw-semibold">Overall Match</div>
                      </div>
                    </div>
                    <div className="col-md-3 text-center border-md-end">
                      <div>
                        <div className="fw-bold" style={{ fontSize: '1.5rem' }}>
                          {candidateMatchDetails.match.suitability || candidateMatchDetails.match.result || 'Review Required'}
                        </div>
                        <div className="text-muted">Suitability</div>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="text-muted mb-2">
                        <strong>Explanation:</strong>
                        <p className="mb-0 mt-1" style={{ fontSize: '0.95rem' }}>
                          {candidateMatchDetails.match.explanation ||
                            `Candidate shows ${candidateMatchDetails.match.overallMatchScore}% alignment with job requirements.`}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Scoring Breakdown */}
                <div className="row g-3 mb-4">
                  <div className="col-md-3">
                    <div className="card text-center">
                      <div className="card-body">
                        <small className="text-muted text-uppercase">Skills Match</small>
                        <div className={`h4 mb-0 text-${getScoreColor(candidateMatchDetails.match.skillMatchPercentage ?? candidateMatchDetails.match.skillMatchScore ?? 0)}`}>
                          {candidateMatchDetails.match.skillMatchPercentage ?? candidateMatchDetails.match.skillMatchScore ?? candidateMatchDetails.match.overallMatchScore ?? 0}%
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="card text-center">
                      <div className="card-body">
                        <small className="text-muted text-uppercase">Experience Match</small>
                        <div className={`h4 mb-0 text-${getScoreColor(candidateMatchDetails.match.experienceMatchScore || 0)}`}>
                          {candidateMatchDetails.match.experienceMatchScore || 0}%
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="card text-center">
                      <div className="card-body">
                        <small className="text-muted text-uppercase">Education Match</small>
                        <div className={`h4 mb-0 text-${getScoreColor(candidateMatchDetails.match.educationMatchScore || 0)}`}>
                          {candidateMatchDetails.match.educationMatchScore || 0}%
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="card text-center">
                      <div className="card-body">
                        <small className="text-muted text-uppercase">Designation Match</small>
                        <div className={`h4 mb-0 text-${getScoreColor(candidateMatchDetails.match.designationMatchScore || 0)}`}>
                          {candidateMatchDetails.match.designationMatchScore || 0}%
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Extracted Skills Section */}
                <div className="row g-3 mb-4">
                  <div className="col-md-6">
                    <div className="card">
                      <div className="card-header bg-primary text-white">
                        <h6 className="mb-0">
                          <i className="bi bi-briefcase me-2"></i>Job Description Skills ({candidateMatchDetails.match.jobSkills?.length || 0})
                        </h6>
                      </div>
                      <div className="card-body">
                        {candidateMatchDetails.match.jobSkills?.length > 0 ? (
                          <div className="d-flex flex-wrap gap-2">
                            {candidateMatchDetails.match.jobSkills.map((skill) => (
                              <span key={skill} className="badge bg-primary">{skill}</span>
                            ))}
                          </div>
                        ) : (
                          <p className="text-muted mb-0 small">No skills extracted from job description</p>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="card">
                      <div className="card-header bg-info text-white">
                        <h6 className="mb-0">
                          <i className="bi bi-file-earmark-text me-2"></i>Resume Skills ({candidateMatchDetails.match.resumeSkills?.length || 0})
                        </h6>
                      </div>
                      <div className="card-body">
                        {candidateMatchDetails.match.resumeSkills?.length > 0 ? (
                          <div className="d-flex flex-wrap gap-2">
                            {candidateMatchDetails.match.resumeSkills.map((skill) => (
                              <span key={skill} className="badge bg-info">{skill}</span>
                            ))}
                          </div>
                        ) : (
                          <p className="text-muted mb-0 small">No skills extracted from resume</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Skills Analysis */}
                <div className="row g-3 mb-4">
                  <div className="col-md-6">
                    <div className="card">
                      <div className="card-header bg-success text-white">
                        <h6 className="mb-0">
                          <i className="bi bi-check-circle me-2"></i>Matched Skills ({candidateMatchDetails.match.matchedSkills?.length || 0})
                        </h6>
                      </div>
                      <div className="card-body">
                        {candidateMatchDetails.match.matchedSkills?.length > 0 ? (
                          <div className="d-flex flex-wrap gap-2">
                            {candidateMatchDetails.match.matchedSkills.map((skill) => (
                              <span key={skill} className="badge bg-success">{skill}</span>
                            ))}
                          </div>
                        ) : (
                          <p className="text-muted mb-0 small">No matched skills found</p>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="card">
                      <div className="card-header bg-danger text-white">
                        <h6 className="mb-0">
                          <i className="bi bi-x-circle me-2"></i>Missing Skills ({candidateMatchDetails.match.missingSkills?.length || 0})
                        </h6>
                      </div>
                      <div className="card-body">
                        {candidateMatchDetails.match.missingSkills?.length > 0 ? (
                          <div className="d-flex flex-wrap gap-2">
                            {candidateMatchDetails.match.missingSkills.map((skill) => (
                              <span key={skill} className="badge bg-danger">{skill}</span>
                            ))}
                          </div>
                        ) : (
                          <p className="text-muted mb-0 small">All required skills matched!</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Preferred Skills */}
                {candidateMatchDetails.match.preferredSkillsMatched?.length > 0 && (
                  <div className="card mb-4">
                    <div className="card-header bg-info text-white">
                      <h6 className="mb-0">
                        <i className="bi bi-star-fill me-2"></i>Preferred Skills Matched ({candidateMatchDetails.match.preferredSkillsMatched.length})
                      </h6>
                    </div>
                    <div className="card-body">
                      <div className="d-flex flex-wrap gap-2">
                        {candidateMatchDetails.match.preferredSkillsMatched.map((skill) => (
                          <span key={skill} className="badge bg-info">{skill}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Experience Analysis */}
                <div className="row g-3 mb-4">
                  <div className="col-md-6">
                    <div className="card">
                      <div className="card-header">
                        <h6 className="mb-0">Experience Analysis</h6>
                      </div>
                      <div className="card-body">
                        <div className="mb-3">
                          <small className="text-muted text-uppercase">Candidate's Experience</small>
                          <p className="fw-semibold mb-0">{candidateMatchDetails.match.candidateExperience || candidateMatchDetails.candidate.experience || 'N/A'}</p>
                        </div>
                        <div>
                          <small className="text-muted text-uppercase">Required Experience</small>
                          <p className="fw-semibold mb-0">{candidateMatchDetails.match.requiredExperience || `${job.minimumExperience}–${job.maximumExperience} years`}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="card">
                      <div className="card-header">
                        <h6 className="mb-0">Education Analysis</h6>
                      </div>
                      <div className="card-body">
                        <div className="mb-3">
                          <small className="text-muted text-uppercase">Candidate's Education</small>
                          <p className="fw-semibold mb-0">{candidateMatchDetails.match.candidateEducation || candidateMatchDetails.candidate.education || 'Not specified'}</p>
                        </div>
                        <div>
                          <small className="text-muted text-uppercase">Required Education</small>
                          <p className="fw-semibold mb-0">{candidateMatchDetails.match.requiredEducation || job.education || 'Not specified'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Matching Reasons */}
                {(candidateMatchDetails.match.matchingReasons?.length > 0 || candidateMatchDetails.match.missingReasons?.length > 0) && (
                  <div className="row g-3 mb-4">
                    {candidateMatchDetails.match.matchingReasons?.length > 0 && (
                      <div className="col-md-6">
                        <div className="card">
                          <div className="card-header bg-light">
                            <h6 className="mb-0">
                              <i className="bi bi-hand-thumbs-up text-success me-2"></i>Strengths
                            </h6>
                          </div>
                          <div className="card-body">
                            <ul className="mb-0 ps-3">
                              {candidateMatchDetails.match.matchingReasons.map((reason, idx) => (
                                <li key={idx} className="mb-2 small">{reason}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    )}
                    {candidateMatchDetails.match.missingReasons?.length > 0 && (
                      <div className="col-md-6">
                        <div className="card">
                          <div className="card-header bg-light">
                            <h6 className="mb-0">
                              <i className="bi bi-exclamation-triangle text-warning me-2"></i>Areas to Improve
                            </h6>
                          </div>
                          <div className="card-body">
                            <ul className="mb-0 ps-3">
                              {candidateMatchDetails.match.missingReasons.map((reason, idx) => (
                                <li key={idx} className="mb-2 small">{reason}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="row gy-2">
                  <div className="col-md-6">
                    <div className="d-flex gap-2 flex-wrap">
                      {candidateMatchDetails.candidate.resumeUrl && (
                        <>
                          <a
                            href={getResumeUrl(candidateMatchDetails.candidate.resumeUrl)}
                            target="_blank"
                            rel="noreferrer"
                            className="btn btn-outline-primary btn-sm"
                          >
                            <i className="bi bi-file-earmark-pdf me-1"></i>View Resume
                          </a>
                          <a
                            href={getResumeUrl(candidateMatchDetails.candidate.resumeUrl)}
                            download={candidateMatchDetails.candidate.resumeFilename}
                            className="btn btn-outline-secondary btn-sm"
                          >
                            <i className="bi bi-download me-1"></i>Download
                          </a>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="d-flex gap-2 flex-wrap justify-md-end">
                      <button
                        className="btn btn-success btn-sm"
                        onClick={() => handleStatusUpdate(candidateMatchDetails.candidate._id, 'Shortlisted')}
                        disabled={actionLoading}
                      >
                        <i className="bi bi-check-circle me-1"></i>Shortlist
                      </button>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleStatusUpdate(candidateMatchDetails.candidate._id, 'Rejected')}
                        disabled={actionLoading}
                      >
                        <i className="bi bi-x-circle me-1"></i>Reject
                      </button>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="alert alert-secondary">Unable to load match details.</div>
            )}
          </div>
        </div>
      )}
    </Layout>
  );
};

export default JobMatchCandidates;
