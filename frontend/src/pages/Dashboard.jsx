import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Layout from '../components/Layout';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStats = async () => {
    try {
      const response = await api.get('/dashboard/stats');
      setStats(response.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    const handleDashboardRefresh = () => {
      setLoading(true);
      setError(null);
      fetchStats();
    };

    window.addEventListener('dashboardUpdated', handleDashboardRefresh);
    return () => window.removeEventListener('dashboardUpdated', handleDashboardRefresh);
  }, []);

  const summaryCards = stats
    ? [
        { label: 'Total Jobs', value: stats.summary.totalJobs, variant: 'primary', type: 'jobs', route: '/jobs' },
        { label: 'Active Jobs', value: stats.summary.activeJobs, variant: 'success', type: 'jobs', route: '/jobs?status=Active' },
        { label: 'Total Candidates', value: stats.summary.totalCandidates, variant: 'info', type: 'candidates', route: '/candidates' },
        { label: 'Shortlisted', value: stats.summary.shortlisted || 0, variant: 'warning', type: 'candidates', route: '/candidates?status=Shortlisted' },
        { label: 'Interviews', value: stats.summary.interviews || 0, variant: 'secondary', type: 'interviews', route: '/interviews' },
        { label: 'Offers Accepted', value: stats.summary.offersAccepted || 0, variant: 'warning', type: 'candidates', route: '/candidates?status=Offer%20Accepted' },
        { label: 'Hired', value: stats.summary.hired || 0, variant: 'dark', type: 'candidates', route: '/candidates?status=Hired' },
        { label: 'Rejected', value: stats.summary.rejected || 0, variant: 'danger', type: 'candidates', route: '/candidates?status=Rejected' },
      ]
    : [];

  const handleCardClick = (route) => {
    if (route) navigate(route);
  };

  return (
    <Layout>
      <div className="mb-4">
        <div className="d-flex flex-column flex-md-row justify-content-between gap-3 align-items-start">
          <div>
            <h3 className="mb-1">Dashboard</h3>
            <p className="text-muted mb-0">A focused view of essential hiring metrics.</p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status"></div>
        </div>
      ) : error ? (
        <div className="alert alert-danger">{error}</div>
      ) : (
        <>
          <div className="row g-3 mb-4">
            {summaryCards.map((item, idx) => (
              <div key={item.label} className="col-6 col-sm-4 col-md-4 col-lg-3">
                <div
                  className={`metric-card metric-${idx} p-3 rounded shadow-sm d-flex align-items-center gap-3 cursor-pointer transition-all hover-shadow`} 
                  style={{ cursor: 'pointer', transition: 'all 0.2s ease', boxShadow: '0 0.25rem 0.75rem rgba(0,0,0,0.08)' }}
                  onClick={() => handleCardClick(item.route)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleCardClick(item.route);
                    }
                  }}
                >
                  <div className={`metric-icon bg-${item.variant} text-white rounded-circle d-flex align-items-center justify-content-center`} style={{width:48,height:48}}>
                    {item.label === 'Total Jobs' && <i className="bi bi-list-check"></i>}
                    {item.label === 'Active Jobs' && <i className="bi bi-rocket-takeoff"></i>}
                    {item.label === 'Total Candidates' && <i className="bi bi-people-fill"></i>}
                    {item.label === 'Shortlisted' && <i className="bi bi-person-check-fill"></i>}
                    {item.label === 'Interviews' && <i className="bi bi-calendar-event"></i>}
                    {item.label === 'Offers Accepted' && <i className="bi bi-hand-thumbs-up-fill"></i>}
                    {item.label === 'Hired' && <i className="bi bi-award"></i>}
                    {item.label === 'Rejected' && <i className="bi bi-x-circle"></i>}
                  </div>
                  <div>
                    <div className="small text-muted">{item.label}</div>
                    <div className="h5 mb-0">{item.value ?? 0}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {stats.pipelineStages?.length > 0 && (
            <div className="card mb-4 shadow-sm">
              <div className="card-body">
                <h5 className="mb-3">Pipeline Snapshot</h5>
                <div className="d-flex gap-3 overflow-auto">
                  {stats.pipelineStages.map((stage) => (
                    <div key={stage.label} className="p-3 bg-white rounded text-center shadow-sm" style={{minWidth:140}}>
                      <div className="small text-muted text-uppercase">{stage.label}</div>
                      <div className="h4 mb-0">{stage.count}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </Layout>
  );
};

export default Dashboard;
