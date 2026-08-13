import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { getJob } from '../services/jobService';
import { getMatchingCandidates, getCandidateMatch, saveCandidateMatch, updateCandidateStatus } from '../services/matchService';

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
  { value: 'Suitable', label: 'Suitable' },
  { value: 'Review Required', label: 'Review Required' },
  { value: 'Not Suitable', label: 'Not Suitable' },
];

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
    sortBy: 'name',
  });
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [candidateMatchDetails, setCandidateMatchDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const filteredCandidates = useMemo(() => candidates, [candidates]);

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
        setCandidates(candidatesRes.data.data.candidates);
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
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status"></div>
      </div>
    );
  }

  if (error) {
    return <div className="alert alert-danger">{error}</div>;
  }

  if (!job) {
    return <div className="alert alert-warning">Job not found.</div>;
  }

  return (
    <div className="container-fluid px-4 py-4">
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start gap-3 mb-4">
        <div>
          <h3>Match Candidates</h3>
          <p className="text-muted mb-0">Compare candidates against job requirements and review match results.</p>
        </div>
        <div className="text-md-end">
          <button className="btn btn-outline-secondary me-2" onClick={() => navigate(`/jobs/${id}`)}>
            Back to Job Details
          </button>
        </div>
      </div>

      <div className="card mb-4">
        <div className="card-body">
          <div className="row gy-3">
            <div className="col-md-4">
              <p className="mb-1 text-uppercase text-muted small">Job ID</p>
              <p className="fw-semibold mb-0">{job.jobId}</p>
            </div>
            <div className="col-md-4">
              <p className="mb-1 text-uppercase text-muted small">Job Title</p>
              <p className="fw-semibold mb-0">{job.jobTitle}</p>
            </div>
            <div className="col-md-4">
              <p className="mb-1 text-uppercase text-muted small">Required Experience</p>
              <p className="fw-semibold mb-0">{job.minimumExperience}–{job.maximumExperience} Years</p>
            </div>
          </div>

          <div className="mt-3">
            <p className="mb-1 text-uppercase text-muted small">Required Skills</p>
            <div className="d-flex flex-wrap gap-2">
              {job.requiredSkills?.length > 0 ? (
                job.requiredSkills.map((skill) => (
                  <span key={skill} className="badge bg-primary">{skill}</span>
                ))
              ) : (
                <span className="text-muted">None</span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="card mb-4">
        <div className="card-body">
          <div className="row gy-3 align-items-end">
            <div className="col-md-4">
              <label className="form-label">Search Candidate</label>
              <input
                type="text"
                className="form-control"
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                placeholder="Name, designation, location"
              />
            </div>
            <div className="col-md-2">
              <label className="form-label">Experience</label>
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
              <label className="form-label">Result</label>
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
              <label className="form-label">Sort By</label>
              <select
                className="form-select"
                value={filters.sortBy}
                onChange={(e) => handleFilterChange('sortBy', e.target.value)}
              >
                <option value="name">Candidate Name</option>
                <option value="experience">Experience</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {filteredCandidates.length === 0 ? (
        <div className="card">
          <div className="card-body text-center">
            <h5 className="card-title">No candidates available.</h5>
            <p className="card-text">No candidates match the selected filters or there are no uploaded resumes.</p>
            <Link to="/candidates/create" className="btn btn-primary">Add Candidate</Link>
          </div>
        </div>
      ) : (
        <div className="card mb-4">
          <div className="card-body">
            <div className="table-responsive">
              <table className="table align-middle">
                <thead>
                  <tr>
                    <th>Candidate Name</th>
                    <th>Resume</th>
                    <th>Experience</th>
                    <th>Result</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCandidates.map((candidate) => (
                    <tr key={candidate._id}>
                      <td>{candidate.firstName} {candidate.lastName}</td>
                      <td>{candidate.resumeFilename || 'No resume'}</td>
                      <td>{candidate.experience || 'N/A'}</td>
                      <td>
                        <span className={`badge ${
                          candidate.result === 'Suitable'
                            ? 'bg-success'
                            : candidate.result === 'Review Required'
                            ? 'bg-warning text-dark'
                            : 'bg-danger'
                        }`}>{candidate.result}</span>
                      </td>
                      <td>
                        <button
                          className="btn btn-sm btn-outline-primary"
                          onClick={() => openMatchDetails(candidate)}
                        >
                          View Match
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {selectedCandidate && (
        <div className="card">
          <div className="card-body">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div>
                <h5 className="mb-1">Match Details</h5>
                <p className="text-muted mb-0">{selectedCandidate.firstName} {selectedCandidate.lastName}</p>
              </div>
              <button className="btn btn-sm btn-outline-secondary" onClick={() => setSelectedCandidate(null)}>
                Close
              </button>
            </div>
            {detailsLoading ? (
              <div className="text-center py-4">
                <div className="spinner-border text-primary" role="status"></div>
              </div>
            ) : candidateMatchDetails ? (
              <>
                <div className="row gy-3">
                  <div className="col-md-4">
                    <strong>Candidate</strong>
                    <p className="mb-0">{candidateMatchDetails.candidate.firstName} {candidateMatchDetails.candidate.lastName}</p>
                  </div>
                  <div className="col-md-4">
                    <strong>Resume</strong>
                    <p className="mb-0">{candidateMatchDetails.candidate.resumeFilename || 'Not uploaded'}</p>
                  </div>
                  <div className="col-md-4">
                    <strong>Job</strong>
                    <p className="mb-0">{candidateMatchDetails.job.jobTitle}</p>
                    <small className="text-muted">Job ID: {candidateMatchDetails.job.jobId}</small>
                  </div>
                </div>

                <div className="my-4">
                  <h6>Match Result</h6>
                  <span className={`badge ${
                    candidateMatchDetails.match.result === 'Suitable'
                      ? 'bg-success'
                      : candidateMatchDetails.match.result === 'Review Required'
                      ? 'bg-warning text-dark'
                      : 'bg-danger'
                  }`}>{candidateMatchDetails.match.result}</span>
                </div>

                <div className="row gy-3">
                  <div className="col-md-6">
                    <div className="card bg-light">
                      <div className="card-body">
                        <h6>Matching Skills</h6>
                        {candidateMatchDetails.match.details.matchingSkills.length > 0 ? (
                          <ul className="mb-0">
                            {candidateMatchDetails.match.details.matchingSkills.map((skill) => (
                              <li key={skill}>{skill}</li>
                            ))}
                          </ul>
                        ) : (
                          <p className="mb-0 text-muted">No matching skills found.</p>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="card bg-light">
                      <div className="card-body">
                        <h6>Missing Skills</h6>
                        {candidateMatchDetails.match.details.missingSkills.length > 0 ? (
                          <ul className="mb-0">
                            {candidateMatchDetails.match.details.missingSkills.map((skill) => (
                              <li key={skill}>{skill}</li>
                            ))}
                          </ul>
                        ) : (
                          <p className="mb-0 text-muted">None</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="row gy-3 mt-3">
                  <div className="col-md-4">
                    <div className="card bg-light">
                      <div className="card-body">
                        <h6>Experience</h6>
                        <p className="mb-1">Candidate: {candidateMatchDetails.candidate.experience || 'N/A'}</p>
                        <p className="mb-0">Required: {job.minimumExperience}–{job.maximumExperience} Years</p>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="card bg-light">
                      <div className="card-body">
                        <h6>Education Match</h6>
                        <p className="mb-0">{candidateMatchDetails.match.details.educationMatch}</p>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="card bg-light">
                      <div className="card-body">
                        <h6>Other Matches</h6>
                        <p className="mb-1">Location: {candidateMatchDetails.match.details.locationMatch}</p>
                        <p className="mb-0">Title: {candidateMatchDetails.match.details.titleMatch}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 d-flex flex-wrap gap-2">
                  {candidateMatchDetails.candidate.resumeUrl && (
                    <a
                      href={candidateMatchDetails.candidate.resumeUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="btn btn-outline-primary"
                    >
                      View Resume
                    </a>
                  )}
                  {candidateMatchDetails.candidate.resumeUrl && (
                    <a
                      href={candidateMatchDetails.candidate.resumeUrl}
                      download={candidateMatchDetails.candidate.resumeFilename}
                      className="btn btn-outline-secondary"
                    >
                      Download Resume
                    </a>
                  )}
                  <button
                    className="btn btn-success"
                    onClick={() => handleStatusUpdate(candidateMatchDetails.candidate._id, 'Shortlisted')}
                    disabled={actionLoading}
                  >
                    Shortlist
                  </button>
                  <button
                    className="btn btn-danger"
                    onClick={() => handleStatusUpdate(candidateMatchDetails.candidate._id, 'Rejected')}
                    disabled={actionLoading}
                  >
                    Reject
                  </button>
                  <button
                    className="btn btn-outline-secondary"
                    onClick={() => setSelectedCandidate(null)}
                  >
                    Back to Candidates
                  </button>
                </div>
              </>
            ) : (
              <div className="alert alert-secondary">Select a candidate to view match details.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default JobMatchCandidates;
