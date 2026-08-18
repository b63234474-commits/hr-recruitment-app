import { useEffect, useState } from 'react';
import api from '../services/api';

const CandidatesBySource = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await api.get('/analytics/sources');
        setData(response.data.sources || []);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load source analytics');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const sourceColors = {
    'LinkedIn': '#0077B5',
    'Indeed': '#003366',
    'Naukri': '#FF6B41',
    'Referral': '#4CAF50',
    'Company Website': '#2196F3',
    'Email': '#9C27B0',
    'Recruiter Sourcing': '#FF9800',
    'Walk-in': '#F44336',
    'Other': '#757575'
  };

  const sourceEmojis = {
    'LinkedIn': '💼',
    'Indeed': '🔍',
    'Naukri': '📱',
    'Referral': '👥',
    'Company Website': '🌐',
    'Email': '📧',
    'Recruiter Sourcing': '🎯',
    'Walk-in': '🚶',
    'Other': '❓'
  };

  const total = data.reduce((sum, item) => sum + item.count, 0);

  if (loading) return <div className="p-3">Loading...</div>;
  if (error) return <div className="p-3 text-danger">{error}</div>;

  return (
    <div className="card">
      <div className="card-header bg-light">
        <h5 className="mb-0">Candidates by Source</h5>
      </div>
      <div className="card-body p-0">
        <div className="table-responsive">
          <table className="table table-sm mb-0">
            <thead className="table-light">
              <tr>
                <th>Source</th>
                <th className="text-end">Count</th>
                <th className="text-end">%</th>
                <th>Distribution</th>
              </tr>
            </thead>
            <tbody>
              {data.map((item, idx) => {
                const percentage = total > 0 ? ((item.count / total) * 100).toFixed(1) : 0;
                return (
                  <tr key={idx}>
                    <td>
                      <span className="me-2">{sourceEmojis[item.source] || '📌'}</span>
                      <span className="badge" style={{backgroundColor: sourceColors[item.source] || '#757575'}}>
                        {item.source || 'Unknown'}
                      </span>
                    </td>
                    <td className="text-end fw-bold">{item.count}</td>
                    <td className="text-end">{percentage}%</td>
                    <td>
                      <div className="progress">
                        <div
                          className="progress-bar"
                          style={{
                            width: `${percentage}%`,
                            backgroundColor: sourceColors[item.source] || '#757575'
                          }}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            {data.length > 0 && (
              <tfoot>
                <tr>
                  <td className="fw-bold">Total</td>
                  <td className="text-end fw-bold">{total}</td>
                  <td className="text-end fw-bold">100%</td>
                  <td></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
};

export default CandidatesBySource;
