import { useEffect, useState } from 'react';
import api from '../services/api';

const ActivityTimeline = ({ candidateId }) => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [filterType, setFilterType] = useState('');
  const [selectedType, setSelectedType] = useState('');

  const activityTypeLabels = {
    APPLICATION: '📋 Application',
    RESUME_UPLOADED: '📄 Resume Uploaded',
    RESUME_PARSED: '✅ Resume Parsed',
    SHORTLISTED: '⭐ Shortlisted',
    STATUS_CHANGED: '🔄 Status Changed',
    INTERVIEW_SCHEDULED: '📅 Interview Scheduled',
    INTERVIEW_RESCHEDULED: '🔁 Interview Rescheduled',
    INTERVIEW_COMPLETED: '✔️ Interview Completed',
    INTERVIEW_CANCELLED: '❌ Interview Cancelled',
    FEEDBACK_SUBMITTED: '💬 Feedback Submitted',
    SELECTED: '🎉 Selected',
    REJECTED: '👋 Rejected',
    OFFER_CREATED: '📋 Offer Created',
    OFFER_SENT: '📤 Offer Sent',
    OFFER_ACCEPTED: '✅ Offer Accepted',
    OFFER_REJECTED: '❌ Offer Rejected',
    ONBOARDING_STARTED: '🚀 Onboarding Started',
    ONBOARDING_COMPLETED: '🏁 Onboarding Completed',
    EMAIL_SENT: '📧 Email Sent',
    NOTE_ADDED: '📝 Note Added',
    TAG_ADDED: '🏷️ Tag Added',
    TAG_REMOVED: '🗑️ Tag Removed',
    CANDIDATE_UPDATED: '✏️ Candidate Updated',
    CANDIDATE_CREATED: '✨ Candidate Created',
  };

  const activityCategories = {
    Application: ['APPLICATION'],
    Resume: ['RESUME_UPLOADED', 'RESUME_PARSED'],
    Status: ['STATUS_CHANGED', 'SHORTLISTED', 'SELECTED', 'REJECTED'],
    Interview: ['INTERVIEW_SCHEDULED', 'INTERVIEW_RESCHEDULED', 'INTERVIEW_COMPLETED', 'INTERVIEW_CANCELLED', 'FEEDBACK_SUBMITTED'],
    Email: ['EMAIL_SENT'],
    Offer: ['OFFER_CREATED', 'OFFER_SENT', 'OFFER_ACCEPTED', 'OFFER_REJECTED'],
    Onboarding: ['ONBOARDING_STARTED', 'ONBOARDING_COMPLETED'],
    Notes: ['NOTE_ADDED'],
    Admin: ['CANDIDATE_CREATED', 'CANDIDATE_UPDATED', 'TAG_ADDED', 'TAG_REMOVED'],
  };

  const loadActivities = async (pageNum = 1, type = '') => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({
        page: pageNum,
        limit: 20,
      });
      if (type) {
        params.append('type', type);
      }

      const response = await api.get(`/activities/candidates/${candidateId}/activities?${params.toString()}`);
      const { activities: newActivities, pagination } = response.data.data;

      if (pageNum === 1) {
        setActivities(newActivities);
      } else {
        setActivities((prev) => [...prev, ...newActivities]);
      }

      setPage(pageNum);
      setHasMore(pagination.page < pagination.pages);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load activities');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadActivities(1, selectedType);
  }, [candidateId, selectedType]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const getActivityColor = (type) => {
    if (activityCategories.Resume.includes(type)) return '#FF6B6B';
    if (activityCategories.Interview.includes(type)) return '#4ECDC4';
    if (activityCategories.Offer.includes(type)) return '#FFD93D';
    if (activityCategories.Onboarding.includes(type)) return '#6BCF7F';
    if (activityCategories.Email.includes(type)) return '#95E1D3';
    if (['SELECTED', 'SHORTLISTED'].includes(type)) return '#A8D8EA';
    if (['REJECTED'].includes(type)) return '#FF6B6B';
    return '#6F42C1';
  };

  if (loading && activities.length === 0) {
    return (
      <div className="card">
        <div className="card-body text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-body">
        <h6 className="text-uppercase text-muted mb-3">Activity Timeline</h6>

        {/* Filter by activity type */}
        <div className="mb-4">
          <label className="form-label small text-muted">Filter by activity type</label>
          <div className="d-flex flex-wrap gap-2">
            <button
              type="button"
              className={`btn btn-sm ${selectedType === '' ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => setSelectedType('')}
            >
              All Activities
            </button>
            {Object.keys(activityCategories).map((category) => (
              <button
                key={category}
                type="button"
                className={`btn btn-sm ${selectedType === category ? 'btn-primary' : 'btn-outline-primary'}`}
                onClick={() => setSelectedType(category)}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {error && <div className="alert alert-danger mb-4">{error}</div>}

        {activities.length === 0 ? (
          <div className="text-center text-muted py-5">
            <p>No activities found for this candidate.</p>
          </div>
        ) : (
          <div className="timeline">
            {activities.map((activity, index) => (
              <div key={activity._id} className="timeline-item mb-3">
                <div className="d-flex gap-3">
                  {/* Timeline dot */}
                  <div className="timeline-dot" style={{ minWidth: '20px' }}>
                    <div
                      className="rounded-circle bg-primary mx-auto"
                      style={{
                        width: '12px',
                        height: '12px',
                        backgroundColor: getActivityColor(activity.type),
                        marginTop: '4px',
                      }}
                    />
                  </div>

                  {/* Activity content */}
                  <div className="flex-grow-1 pb-3" style={{ borderLeft: '2px solid #e9ecef', paddingLeft: '20px' }}>
                    <div className="d-flex justify-content-between align-items-start">
                      <div>
                        <h6 className="mb-1 fw-semibold">{activity.title}</h6>
                        {activity.description && (
                          <p className="text-muted small mb-2">{activity.description}</p>
                        )}
                      </div>
                      <small className="text-muted text-nowrap ms-2">
                        {formatDate(activity.createdAt)}
                        <br />
                        {formatTime(activity.createdAt)}
                      </small>
                    </div>

                    {/* Activity metadata */}
                    {activity.performedBy && (
                      <small className="text-muted d-block mt-2">
                        By: <strong>{activity.performedBy.firstName} {activity.performedBy.lastName}</strong>
                      </small>
                    )}

                    {/* Metadata details */}
                    {activity.metadata && Object.keys(activity.metadata).length > 0 && (
                      <div className="small mt-2 p-2 bg-light rounded">
                        {activity.metadata.previousStatus && activity.metadata.newStatus && (
                          <div>
                            <strong>Status:</strong> {activity.metadata.previousStatus} → {activity.metadata.newStatus}
                          </div>
                        )}
                        {activity.metadata.recipient && (
                          <div>
                            <strong>To:</strong> {activity.metadata.recipient}
                          </div>
                        )}
                        {activity.metadata.subject && (
                          <div>
                            <strong>Subject:</strong> {activity.metadata.subject}
                          </div>
                        )}
                        {activity.metadata.jobTitle && (
                          <div>
                            <strong>Job:</strong> {activity.metadata.jobTitle}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Load More button */}
        {hasMore && (
          <div className="text-center mt-4">
            <button
              type="button"
              className="btn btn-outline-primary"
              onClick={() => loadActivities(page + 1, selectedType)}
              disabled={loading}
            >
              {loading ? 'Loading...' : 'Load More Activities'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivityTimeline;
