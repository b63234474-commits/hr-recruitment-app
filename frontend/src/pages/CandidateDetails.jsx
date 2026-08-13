import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { getCandidate, deleteCandidate, matchCandidate } from '../services/candidateService';
import { getInterviews } from '../services/interviewService';

const CandidateDetails = () => {
  const { id } = useParams();
  const [candidate, setCandidate] = useState(null);
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [matchLoading, setMatchLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const loadCandidate = async () => {
      setLoading(true);
      try {
        const response = await getCandidate(id);
        setCandidate(response.data.data.candidate);
        const interviewsResponse = await getInterviews({ candidate: id, limit: 50 });
        setInterviews(interviewsResponse.data.data.interviews);
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

  const handleMatch = async () => {
    setMatchLoading(true);
    setError('');
    setSuccess('');
    try {
      const response = await matchCandidate(id);
      setCandidate(response.data.data.candidate);
      setSuccess('Match results recalculated successfully.');
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to recalculate match');
    } finally {
      setMatchLoading(false);
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
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start gap-3 mb-4">
        <div className="d-flex align-items-center gap-3">
          <div
            className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center"
            style={{ width: 72, height: 72 }}
          >
            <span className="fs-3 fw-bold">
              {candidate.firstName?.[0] || 'C'}{candidate.lastName?.[0] || ''}
            </span>
          </div>
          <div>
            <h3 className="mb-1">{candidate.firstName} {candidate.lastName}</h3>
            <p className="text-muted mb-2">{candidate.currentDesignation || 'Candidate profile'}</p>
            <div className="d-flex flex-wrap gap-2">
              <span className="badge bg-secondary">{candidate.status || 'Active'}</span>
              <span className="badge bg-info text-dark">{candidate.source || 'Unknown source'}</span>
              <span className="badge bg-light text-dark">{candidate.experience || 'Experience N/A'}</span>
            </div>
          </div>
        </div>

        <div className="d-flex flex-wrap gap-2">
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
        <div className="col-lg-8">
          <div className="card mb-4 shadow-sm">
            <div className="card-body">
              <div className="mb-3">
                <h5 className="card-title mb-1">Candidate Match</h5>
                <p className="text-muted mb-0">{candidate.matchCategory || 'Review Required'}</p>
              </div>
              <div className="row g-3">
                <div className="col-sm-6">
                  <div className="small text-uppercase text-muted mb-2">Matching Skills</div>
                  <p className="mb-0">{candidate.matchDetails?.matchingSkills?.join(', ') || '-'}</p>
                </div>
                <div className="col-sm-6">
                  <div className="small text-uppercase text-muted mb-2">Missing Skills</div>
                  <p className="mb-0">{candidate.matchDetails?.missingSkills?.join(', ') || '-'}</p>
                </div>
                <div className="col-sm-6">
                  <div className="small text-uppercase text-muted mb-2">Experience Match</div>
                  <p className="mb-0">{candidate.matchDetails?.experienceMatch || '-'}</p>
                </div>
                <div className="col-sm-6">
                  <div className="small text-uppercase text-muted mb-2">Education Match</div>
                  <p className="mb-0">{candidate.matchDetails?.educationMatch || '-'}</p>
                </div>
                <div className="col-sm-6">
                  <div className="small text-uppercase text-muted mb-2">Location Match</div>
                  <p className="mb-0">{candidate.matchDetails?.locationMatch || '-'}</p>
                </div>
                <div className="col-sm-6">
                  <div className="small text-uppercase text-muted mb-2">Title Match</div>
                  <p className="mb-0">{candidate.matchDetails?.titleMatch || '-'}</p>
                </div>
              </div>
            </div>
          </div>

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
                <a href={candidate.resumeUrl} target="_blank" rel="noreferrer" className="btn btn-sm btn-outline-primary">
                  Download Resume
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
        </div>

        <div className="col-lg-4">
          <div className="card mb-4 shadow-sm">
            <div className="card-body">
              <h5 className="card-title">Skills</h5>
              <p className="mb-0">{candidate.skills?.join(', ') || '-'}</p>
            </div>
          </div>

          <div className="card mb-4 shadow-sm">
            <div className="card-body">
              <h5 className="card-title">Education</h5>
              <p className="mb-0">{candidate.education || '-'}</p>
            </div>
          </div>

          <div className="card mb-4 shadow-sm">
            <div className="card-body">
              <h5 className="card-title">Certifications</h5>
              <p className="mb-0">{candidate.certifications?.join(', ') || '-'}</p>
            </div>
          </div>

          <div className="card shadow-sm">
            <div className="card-body">
              <h5 className="card-title">Projects</h5>
              <p className="mb-0">{candidate.projects?.join(', ') || '-'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CandidateDetails;
