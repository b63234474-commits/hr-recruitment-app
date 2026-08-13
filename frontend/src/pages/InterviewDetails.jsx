import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { addInterviewFeedback, getInterview } from '../services/interviewService';
import Layout from '../components/Layout';

const initialFeedbackState = {
  technicalSkills: '',
  communication: '',
  problemSolving: '',
  experience: '',
  teamFit: '',
  overallRating: '',
  strengths: '',
  weaknesses: '',
  comments: '',
  recommendation: 'Hire',
};

const InterviewDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [interview, setInterview] = useState(null);
  const [feedback, setFeedback] = useState(initialFeedbackState);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadInterview();
  }, [id]);

  const loadInterview = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await getInterview(id);
      setInterview(response.data.data.interview);
      if (response.data.data.interview.feedback) {
        setFeedback({
          technicalSkills: response.data.data.interview.feedback.technicalSkills || '',
          communication: response.data.data.interview.feedback.communication || '',
          problemSolving: response.data.data.interview.feedback.problemSolving || '',
          experience: response.data.data.interview.feedback.experience || '',
          teamFit: response.data.data.interview.feedback.teamFit || '',
          overallRating: response.data.data.interview.feedback.overallRating || '',
          strengths: response.data.data.interview.feedback.strengths || '',
          weaknesses: response.data.data.interview.feedback.weaknesses || '',
          comments: response.data.data.interview.feedback.comments || '',
          recommendation: response.data.data.interview.feedback.recommendation || 'Hire',
        });
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load interview details');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFeedback((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const feedbackPayload = {
        technicalSkills: Number(feedback.technicalSkills),
        communication: Number(feedback.communication),
        problemSolving: Number(feedback.problemSolving),
        experience: Number(feedback.experience),
        teamFit: Number(feedback.teamFit),
        overallRating: Number(feedback.overallRating),
        strengths: feedback.strengths,
        weaknesses: feedback.weaknesses,
        comments: feedback.comments,
        recommendation: feedback.recommendation,
      };

      await addInterviewFeedback(id, feedbackPayload);
      setSuccess('Feedback saved successfully');
      await loadInterview();
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to save feedback');
    } finally {
      setLoading(false);
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

  if (!interview) {
    return (
      <Layout>
        <div className="alert alert-warning">Interview not found.</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="d-flex justify-content-between align-items-start mb-4 gap-3 flex-column flex-md-row">
        <div>
          <h3 className="mb-1">Interview {interview.interviewId}</h3>
          <p className="text-muted mb-0">Interview details and feedback for the candidate.</p>
        </div>
        <div className="d-flex gap-2 flex-wrap">
          <Link to={`/interviews/${id}/edit`} className="btn btn-outline-secondary">
            Edit Interview
          </Link>
          <button className="btn btn-secondary" onClick={() => navigate('/interviews')}>
            Back to List
          </button>
        </div>
      </div>

      {success && <div className="alert alert-success">{success}</div>}
      {error && <div className="alert alert-danger">{error}</div>}

      <div className="row g-4">
        <div className="col-lg-7">
          <div className="card mb-4">
            <div className="card-body">
              <h5 className="card-title">Interview Overview</h5>
              <dl className="row mb-0">
                <dt className="col-sm-4">Candidate</dt>
                <dd className="col-sm-8">
                  {interview.candidate ? (
                    <Link to={`/candidates/${interview.candidate._id}`} className="text-decoration-none">
                      {interview.candidate.firstName} {interview.candidate.lastName}
                    </Link>
                  ) : 'Unknown'}
                </dd>
                <dt className="col-sm-4">Job</dt>
                <dd className="col-sm-8">{interview.job?.jobTitle || interview.job?.jobId || 'Unassigned'}</dd>
                <dt className="col-sm-4">Assessment</dt>
                <dd className="col-sm-8">{interview.assessment?.title || interview.assessment?._id || 'None'}</dd>
                <dt className="col-sm-4">Type</dt>
                <dd className="col-sm-8">{interview.interviewType}</dd>
                <dt className="col-sm-4">Interviewer</dt>
                <dd className="col-sm-8">{interview.interviewer || '-'}</dd>
                <dt className="col-sm-4">Date</dt>
                <dd className="col-sm-8">{interview.interviewDate ? new Date(interview.interviewDate).toLocaleString() : '-'}</dd>
                <dt className="col-sm-4">Time</dt>
                <dd className="col-sm-8">{`${interview.startTime || '-'} - ${interview.endTime || '-'}`}</dd>
                <dt className="col-sm-4">Location</dt>
                <dd className="col-sm-8">{interview.location || interview.meetingLink || '-'}</dd>
                <dt className="col-sm-4">Status</dt>
                <dd className="col-sm-8">{interview.status}</dd>
              </dl>
            </div>
          </div>

          <div className="card mb-4">
            <div className="card-body">
              <h5 className="card-title">Notes</h5>
              <p className="mb-0 white-space-pre-line">{interview.notes || 'No notes available.'}</p>
            </div>
          </div>
        </div>

        <div className="col-lg-5">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">Feedback</h5>
              <form onSubmit={handleSubmit}>
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label">Technical Skills</label>
                    <input
                      type="number"
                      className="form-control"
                      min="0"
                      max="10"
                      name="technicalSkills"
                      value={feedback.technicalSkills}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Communication</label>
                    <input
                      type="number"
                      className="form-control"
                      min="0"
                      max="10"
                      name="communication"
                      value={feedback.communication}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Problem Solving</label>
                    <input
                      type="number"
                      className="form-control"
                      min="0"
                      max="10"
                      name="problemSolving"
                      value={feedback.problemSolving}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Experience</label>
                    <input
                      type="number"
                      className="form-control"
                      min="0"
                      max="10"
                      name="experience"
                      value={feedback.experience}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Team Fit</label>
                    <input
                      type="number"
                      className="form-control"
                      min="0"
                      max="10"
                      name="teamFit"
                      value={feedback.teamFit}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Overall Rating</label>
                    <input
                      type="number"
                      className="form-control"
                      min="0"
                      max="10"
                      name="overallRating"
                      value={feedback.overallRating}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="col-12">
                    <label className="form-label">Recommendation</label>
                    <select
                      className="form-select"
                      name="recommendation"
                      value={feedback.recommendation}
                      onChange={handleChange}
                    >
                      <option value="Strong Hire">Strong Hire</option>
                      <option value="Hire">Hire</option>
                      <option value="Hold">Hold</option>
                      <option value="Reject">Reject</option>
                    </select>
                  </div>
                  <div className="col-12">
                    <label className="form-label">Strengths</label>
                    <textarea
                      className="form-control"
                      name="strengths"
                      rows="2"
                      value={feedback.strengths}
                      onChange={handleChange}
                    ></textarea>
                  </div>
                  <div className="col-12">
                    <label className="form-label">Weaknesses</label>
                    <textarea
                      className="form-control"
                      name="weaknesses"
                      rows="2"
                      value={feedback.weaknesses}
                      onChange={handleChange}
                    ></textarea>
                  </div>
                  <div className="col-12">
                    <label className="form-label">Comments</label>
                    <textarea
                      className="form-control"
                      name="comments"
                      rows="3"
                      value={feedback.comments}
                      onChange={handleChange}
                    ></textarea>
                  </div>
                </div>

                <button className="btn btn-primary mt-3" type="submit" disabled={loading}>
                  Save Feedback
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default InterviewDetails;
