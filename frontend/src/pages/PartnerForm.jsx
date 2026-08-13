import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { createPartner } from '../services/partnerService';

const PartnerForm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const returnTo = location.state?.returnTo || '/candidates/create';
  const previousCandidateData = location.state?.candidateData || null;
  const [form, setForm] = useState({
    companyName: '',
    location: '',
    contactPersonName: '',
    contactEmail: '',
    contactPhone: '',
    referredEmployeeName: '',
    notes: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleCancel = () => {
    navigate(returnTo, {
      state: {
        candidateData: previousCandidateData,
        selectedPartnerId: location.state?.selectedPartnerId || '',
        selectedPartnerName: location.state?.selectedPartnerName || '',
      },
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await createPartner(form);
      const partner = response.data.data.partner;
      setSuccess('Partner created successfully. Returning to candidate form...');
      navigate(returnTo, {
        state: { selectedPartnerId: partner._id, selectedPartnerName: partner.companyName },
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to save partner');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-fluid px-4 py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3>Partner Registration</h3>
          <p className="text-muted mb-0">Add a new partner company and return to the candidate form automatically.</p>
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="card shadow-sm">
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label">Partner Company Name *</label>
                <input
                  type="text"
                  name="companyName"
                  className="form-control"
                  required
                  value={form.companyName}
                  onChange={handleChange}
                />
              </div>
              <div className="col-md-6">
                <label className="form-label">Location *</label>
                <input
                  type="text"
                  name="location"
                  className="form-control"
                  required
                  value={form.location}
                  onChange={handleChange}
                />
              </div>
              <div className="col-md-6">
                <label className="form-label">Contact Person Name</label>
                <input
                  type="text"
                  name="contactPersonName"
                  className="form-control"
                  value={form.contactPersonName}
                  onChange={handleChange}
                />
              </div>
              <div className="col-md-6">
                <label className="form-label">Contact Email</label>
                <input
                  type="email"
                  name="contactEmail"
                  className="form-control"
                  value={form.contactEmail}
                  onChange={handleChange}
                />
              </div>
              <div className="col-md-6">
                <label className="form-label">Contact Phone</label>
                <input
                  type="text"
                  name="contactPhone"
                  className="form-control"
                  value={form.contactPhone}
                  onChange={handleChange}
                />
              </div>
              <div className="col-md-6">
                <label className="form-label">Referred Employee Name</label>
                <input
                  type="text"
                  name="referredEmployeeName"
                  className="form-control"
                  value={form.referredEmployeeName}
                  onChange={handleChange}
                />
              </div>
              <div className="col-12">
                <label className="form-label">Notes</label>
                <textarea
                  name="notes"
                  className="form-control"
                  rows="4"
                  value={form.notes}
                  onChange={handleChange}
                ></textarea>
              </div>
            </div>

            <div className="mt-4 d-flex gap-2">
              <button type="button" className="btn btn-outline-secondary" onClick={handleCancel}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Saving...' : 'Save Partner'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PartnerForm;
