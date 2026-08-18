import { useEffect, useMemo, useState } from 'react';
import Layout from '../components/Layout';
import api from '../services/api';

const defaultSections = [
  'General',
  'Company',
  'Users & Roles',
  'Recruitment',
  'Jobs',
  'Candidates',
  'ATS & Matching',
  'Interviews',
  'Email',
  'Notifications',
  'Integrations',
  'Careers',
  'Security',
  'Privacy',
  'Storage',
  'Audit Logs',
];

const sectionMap = {
  General: 'general',
  Company: 'company',
  'Users & Roles': 'usersAndRoles',
  Recruitment: 'recruitment',
  Jobs: 'jobs',
  Candidates: 'candidates',
  'ATS & Matching': 'ats',
  Interviews: 'interviews',
  Email: 'email',
  Notifications: 'notifications',
  Integrations: 'integrations',
  Careers: 'careers',
  Security: 'security',
  Privacy: 'privacy',
  Storage: 'storage',
  'Audit Logs': 'audit',
};

const initialForm = {
  general: {},
  company: {},
  usersAndRoles: {},
  recruitment: {},
  jobs: {},
  candidates: {},
  ats: {},
  interviews: {},
  email: {},
  notifications: {},
  integrations: {},
  careers: {},
  security: {},
  privacy: {},
  storage: {},
  audit: {},
};

const toTitle = (value) => value.replace(/([A-Z])/g, ' $1').replace(/^./, (char) => char.toUpperCase());

const Settings = () => {
  const [activeSection, setActiveSection] = useState('General');
  const [settings, setSettings] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        const response = await api.get('/settings');
        const nextData = response.data.data.settings || {};
        setSettings({
          general: nextData.general || {},
          company: nextData.company || {},
          usersAndRoles: nextData.usersAndRoles || {},
          recruitment: nextData.recruitment || {},
          jobs: nextData.jobs || {},
          candidates: nextData.candidates || {},
          ats: nextData.ats || {},
          interviews: nextData.interviews || {},
          email: nextData.email || {},
          notifications: nextData.notifications || {},
          integrations: nextData.integrations || {},
          careers: nextData.careers || {},
          security: nextData.security || {},
          privacy: nextData.privacy || {},
          storage: nextData.storage || {},
          audit: nextData.audit || {},
        });
      } catch (err) {
        setError(err.response?.data?.message || 'Unable to load settings');
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const currentSettings = useMemo(() => settings[sectionMap[activeSection]] || {}, [activeSection, settings]);

  const handleFieldChange = (group, field, value) => {
    setSettings((prev) => ({
      ...prev,
      [group]: {
        ...prev[group],
        [field]: value,
      },
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError('');
      setSuccess('');
      const payload = { [sectionMap[activeSection]]: currentSettings };
      await api.put('/settings', payload);
      setSuccess('Settings saved successfully');
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to save settings');
    } finally {
      setSaving(false);
    }
  };

  const renderField = (key, value) => {
    const label = toTitle(key);
    const isBool = typeof value === 'boolean';
    const isNumber = typeof value === 'number';

    if (isBool) {
      return (
        <label key={key} className="d-flex align-items-center justify-content-between gap-3 py-2 border-bottom">
          <span>{label}</span>
          <input
            type="checkbox"
            className="form-check-input"
            checked={Boolean(value)}
            onChange={(e) => handleFieldChange(sectionMap[activeSection], key, e.target.checked)}
          />
        </label>
      );
    }

    return (
      <div key={key} className="mb-3">
        <label className="form-label text-muted small text-uppercase">{label}</label>
        <input
          type={isNumber ? 'number' : 'text'}
          className="form-control"
          value={value ?? ''}
          onChange={(e) => handleFieldChange(sectionMap[activeSection], key, isNumber ? Number(e.target.value) : e.target.value)}
        />
      </div>
    );
  };

  return (
    <Layout>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 className="mb-1">System Settings</h3>
          <p className="text-muted mb-0">Configure the ATS, hiring workflow, and operational preferences.</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={handleSave} disabled={saving || loading}>
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {loading ? (
        <div className="card shadow-sm">
          <div className="card-body text-center py-5">
            <div className="spinner-border text-primary" role="status" aria-label="Loading settings" />
          </div>
        </div>
      ) : (
        <div className="settings-shell row g-4">
          <div className="col-lg-3">
            <div className="card shadow-sm border-0 h-100 settings-sidebar-card">
              <div className="card-body p-0 settings-sidebar-scroll">
                <div className="list-group list-group-flush">
                  {defaultSections.map((section) => (
                    <button
                      key={section}
                      type="button"
                      className={`list-group-item list-group-item-action border-0 text-start ${activeSection === section ? 'active bg-primary text-white' : ''}`}
                      onClick={() => setActiveSection(section)}
                    >
                      {section}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="col-lg-9">
            <div className="card shadow-sm border-0 settings-content-card">
              <div className="card-body settings-content-scroll">
                <h5 className="mb-3">{activeSection}</h5>
                <div className="row g-3">
                  {Object.entries(currentSettings).map(([key, value]) => (
                    <div className="col-md-6" key={key}>
                      {renderField(key, value)}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default Settings;
