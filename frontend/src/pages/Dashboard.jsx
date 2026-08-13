import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Layout from '../components/Layout';

const Dashboard = () => {
  const { user } = useAuth();
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
        { label: 'Total Jobs', value: stats.summary.totalJobs, variant: 'primary', trendKey: 'totalJobs', stroke: '#6f42c1' },
        { label: 'Active Jobs', value: stats.summary.activeJobs, variant: 'success', trendKey: 'activeJobs', stroke: '#198754' },
        { label: 'Total Candidates', value: stats.summary.totalCandidates, variant: 'info', trendKey: 'totalCandidates', stroke: '#0dcaf0' },
        { label: 'Offers Accepted', value: stats.summary.offersAccepted, variant: 'warning', trendKey: 'offersAccepted', stroke: '#fd7e14' },
        { label: 'Hired', value: stats.summary.hired, variant: 'dark', trendKey: 'hired', stroke: '#343a40' },
      ]
    : [];

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
              <div key={item.label} className="col-6 col-sm-4 col-md-4 col-lg-2">
                <div className={`metric-card metric-${idx} p-3 rounded shadow-sm d-flex align-items-center gap-3`}>
                  <div className={`metric-icon bg-${item.variant} text-white rounded-circle d-flex align-items-center justify-content-center`} style={{width:48,height:48}}>
                    {item.label === 'Total Jobs' && <i className="bi bi-list-check"></i>}
                    {item.label === 'Active Jobs' && <i className="bi bi-rocket-takeoff"></i>}
                    {item.label === 'Total Candidates' && <i className="bi bi-people-fill"></i>}
                    {item.label === 'Offers Accepted' && <i className="bi bi-hand-thumbs-up-fill"></i>}
                    {item.label === 'Hired' && <i className="bi bi-award"></i>}
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
