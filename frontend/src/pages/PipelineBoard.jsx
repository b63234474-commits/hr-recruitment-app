import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Layout from '../components/Layout';
import { getPipelineStatuses, updateCandidateStatus } from '../services/candidateService';

const allowedMoveRoles = ['Admin', 'HR'];

const PipelineBoard = () => {
  const { user } = useAuth();
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [statuses, setStatuses] = useState([]);
  const [updatingStatusId, setUpdatingStatusId] = useState(null);
  const [draggedCandidateId, setDraggedCandidateId] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError('');
      try {
        const [candidateResponse, statusResponse] = await Promise.all([
          api.get('/candidates', { params: { limit: 200 } }),
          getPipelineStatuses(),
        ]);
        setCandidates(candidateResponse.data.data.candidates);
        setStatuses(statusResponse.data.data.statuses || []);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load pipeline data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const groupedCandidates = useMemo(() => {
    return statuses.reduce((acc, status) => {
      acc[status] = candidates.filter((candidate) => candidate.status === status);
      return acc;
    }, {});
  }, [candidates, statuses]);

  const loadActivity = async (candidateId) => {
    try {
      const response = await api.get(`/candidates/${candidateId}`);
      const candidate = response.data.data.candidate;
      setSelectedCandidate(candidate);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load activity history');
    }
  };

  const handleMove = async (candidateId, newStatus) => {
    const candidate = candidates.find((item) => item._id === candidateId);
    if (!candidate || candidate.status === newStatus) return;

    setUpdatingStatusId(candidateId);
    try {
      await updateCandidateStatus(candidateId, { status: newStatus });
      setCandidates((prev) => prev.map((item) => item._id === candidateId ? { ...item, status: newStatus } : item));
      if (selectedCandidate?._id === candidateId) {
        setSelectedCandidate((prev) => prev ? { ...prev, status: newStatus } : prev);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to update status');
    } finally {
      setUpdatingStatusId(null);
    }
  };

  const handleDragStart = (candidateId) => {
    setDraggedCandidateId(candidateId);
  };

  const handleDragOver = (event) => {
    event.preventDefault();
  };

  const handleDrop = (targetStatus) => {
    if (!draggedCandidateId) return;
    handleMove(draggedCandidateId, targetStatus);
    setDraggedCandidateId(null);
  };

  return (
    <Layout>
      <div className="mb-4 d-flex justify-content-between align-items-center">
        <div>
          <h3 className="mb-1">Recruitment Pipeline</h3>
          <p className="text-muted mb-0">
            Drag candidates through stages. HR and Admin may move candidates between pipeline stages.
          </p>
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status"></div>
        </div>
      ) : (
        <div className="row gy-4">
          {statuses.map((status) => (
            <div className="col-12 col-xl-6" key={status}>
              <div className="card h-100">
                <div className="card-header bg-white">
                  <h6 className="mb-0">{status}</h6>
                </div>
                <div
                  className="card-body p-3"
                  style={{ minHeight: '280px' }}
                  onDragOver={handleDragOver}
                  onDrop={() => handleDrop(status)}
                >
                  {groupedCandidates[status].length === 0 ? (
                    <div className="text-muted small">No candidates in this stage.</div>
                  ) : (
                    groupedCandidates[status].map((candidate) => (
                      <div
                        key={candidate._id}
                        className="card mb-2 shadow-sm"
                        style={{ cursor: 'grab' }}
                        draggable={allowedMoveRoles.includes(user?.role)}
                        onDragStart={() => handleDragStart(candidate._id)}
                      >
                        <div
                          className="card-body p-2"
                          onClick={() => loadActivity(candidate._id)}
                        >
                          <div className="d-flex justify-content-between">
                            <strong>{candidate.firstName} {candidate.lastName}</strong>
                          </div>
                          <div className="small text-muted">
                            {candidate.appliedJob?.jobTitle || candidate.appliedJob?.jobId || 'Unassigned job'}
                          </div>
                          <div className="mt-2 d-flex flex-wrap gap-2">
                            {allowedMoveRoles.includes(user?.role) && statuses.length > 0 && (
                              <select
                                className="form-select form-select-sm"
                                value={candidate.status}
                                onChange={(e) => {
                                  e.stopPropagation();
                                  handleMove(candidate._id, e.target.value);
                                }}
                                disabled={updatingStatusId === candidate._id}
                              >
                                <option value={candidate.status}>Move to...</option>
                                {statuses
                                  .filter((target) => target !== status)
                                  .map((target) => (
                                    <option key={target} value={target}>
                                      {target}
                                    </option>
                                  ))}
                              </select>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedCandidate && (
        <div className="card mt-4">
          <div className="card-body">
            <h5 className="card-title">Candidate Activity</h5>
            <p className="text-muted">{selectedCandidate.firstName} {selectedCandidate.lastName}</p>
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label">Current Stage</label>
                <input
                  type="text"
                  className="form-control"
                  value={selectedCandidate.status}
                  disabled
                />
              </div>
              <div className="col-md-6">
                <label className="form-label">Assigned Job</label>
                <input
                  type="text"
                  className="form-control"
                  value={selectedCandidate.appliedJob?.jobTitle || selectedCandidate.appliedJob?.jobId || 'Unassigned'}
                  disabled
                />
              </div>
            </div>
            <div className="mt-4">
              <h6>History</h6>
              {!selectedCandidate.activityLogs?.length ? (
                <div className="text-muted">No status changes recorded yet.</div>
              ) : (
                <ul className="list-group">
                  {selectedCandidate.activityLogs?.map((log) => (
                    <li key={log._id} className="list-group-item">
                      <div className="d-flex justify-content-between">
                        <div>
                          <strong>{log.fromStatus}</strong> → <strong>{log.toStatus}</strong>
                        </div>
                        <div className="small text-muted">{new Date(log.createdAt).toLocaleString()}</div>
                      </div>
                      <div className="small text-muted">By {log.performedBy?.firstName || 'User'}</div>
                      {log.note && <div className="mt-2">{log.note}</div>}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default PipelineBoard;
