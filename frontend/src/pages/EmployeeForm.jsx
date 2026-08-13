import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Layout from '../components/Layout';
import { createEmployee, getEmployee, updateEmployee } from '../services/employeeService';

const initialFormState = {
  candidateId: '',
  offerId: '',
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  department: '',
  designation: '',
  joiningDate: '',
  manager: '',
  employmentType: '',
  location: '',
  source: '',
  hiredJob: '',
  onboardingStatus: 'Pending',
};

const EmployeeForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const [form, setForm] = useState(initialFormState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!isEdit) return;

    const loadEmployee = async () => {
      setLoading(true);
      try {
        const response = await getEmployee(id);
        const emp = response.data.data.employee;
        setForm({
          candidateId: emp.candidateId?._id || '',
          offerId: emp.offerId?._id || '',
          firstName: emp.firstName || '',
          lastName: emp.lastName || '',
          email: emp.email || '',
          phone: emp.phone || '',
          department: emp.department || '',
          designation: emp.designation || '',
          joiningDate: emp.joiningDate ? new Date(emp.joiningDate).toISOString().substring(0, 10) : '',
          manager: emp.manager || '',
          employmentType: emp.employmentType || '',
          location: emp.location || '',
          source: emp.source || '',
          hiredJob: emp.hiredJob || '',
          onboardingStatus: emp.onboardingStatus || 'Pending',
        });
      } catch (err) {
        setError(err.response?.data?.message || 'Unable to load employee');
      } finally {
        setLoading(false);
      }
    };

    loadEmployee();
  }, [id, isEdit]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const payload = {
        ...form,
      };

      if (isEdit) {
        await updateEmployee(id, payload);
        setSuccess('Employee updated successfully');
      } else {
        await createEmployee(payload);
        setSuccess('Employee created successfully');
        setTimeout(() => navigate('/employees'), 700);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to save employee');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="d-flex justify-content-between align-items-center mb-4 gap-3 flex-column flex-md-row">
        <div>
          <h3 className="mb-1">{isEdit ? 'Edit Employee' : 'Add Employee'}</h3>
          <p className="text-muted mb-0">{isEdit ? 'Update employee details and onboarding status.' : 'Create a new employee record.'}</p>
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="card">
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label">Candidate ID</label>
                <input type="text" className="form-control" name="candidateId" value={form.candidateId} onChange={handleChange} placeholder="Candidate ID or ObjectId" />
              </div>
              <div className="col-md-6">
                <label className="form-label">Offer ID</label>
                <input type="text" className="form-control" name="offerId" value={form.offerId} onChange={handleChange} placeholder="Offer ID or ObjectId" />
              </div>
              <div className="col-md-6">
                <label className="form-label">First Name</label>
                <input type="text" className="form-control" name="firstName" value={form.firstName} onChange={handleChange} required />
              </div>
              <div className="col-md-6">
                <label className="form-label">Last Name</label>
                <input type="text" className="form-control" name="lastName" value={form.lastName} onChange={handleChange} required />
              </div>
              <div className="col-md-4">
                <label className="form-label">Email</label>
                <input type="email" className="form-control" name="email" value={form.email} onChange={handleChange} />
              </div>
              <div className="col-md-4">
                <label className="form-label">Phone</label>
                <input type="text" className="form-control" name="phone" value={form.phone} onChange={handleChange} />
              </div>
              <div className="col-md-4">
                <label className="form-label">Joining Date</label>
                <input type="date" className="form-control" name="joiningDate" value={form.joiningDate} onChange={handleChange} />
              </div>
              <div className="col-md-4">
                <label className="form-label">Department</label>
                <input type="text" className="form-control" name="department" value={form.department} onChange={handleChange} />
              </div>
              <div className="col-md-4">
                <label className="form-label">Designation</label>
                <input type="text" className="form-control" name="designation" value={form.designation} onChange={handleChange} />
              </div>
              <div className="col-md-4">
                <label className="form-label">Manager</label>
                <input type="text" className="form-control" name="manager" value={form.manager} onChange={handleChange} />
              </div>
              <div className="col-md-4">
                <label className="form-label">Employment Type</label>
                <input type="text" className="form-control" name="employmentType" value={form.employmentType} onChange={handleChange} />
              </div>
              <div className="col-md-4">
                <label className="form-label">Location</label>
                <input type="text" className="form-control" name="location" value={form.location} onChange={handleChange} />
              </div>
              <div className="col-md-4">
                <label className="form-label">Source</label>
                <input type="text" className="form-control" name="source" value={form.source} onChange={handleChange} />
              </div>
              <div className="col-md-4">
                <label className="form-label">Hired Job</label>
                <input type="text" className="form-control" name="hiredJob" value={form.hiredJob} onChange={handleChange} />
              </div>
              <div className="col-md-4">
                <label className="form-label">Onboarding Status</label>
                <select className="form-select" name="onboardingStatus" value={form.onboardingStatus} onChange={handleChange}>
                  <option value="Pending">Pending</option>
                  <option value="Documents Pending">Documents Pending</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>
            </div>

            <div className="mt-4 d-flex gap-2 justify-content-end">
              <button type="button" className="btn btn-secondary" onClick={() => navigate('/employees')}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Saving...' : 'Save Employee'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
};

export default EmployeeForm;
