import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Layout from '../components/Layout';
import StatusBadge from '../components/StatusBadge';
import { getEmployee, deleteEmployee, updateEmployee } from '../services/employeeService';

const EmployeeDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const loadEmployee = async () => {
    setLoading(true);
    try {
      const response = await getEmployee(id);
      setEmployee(response.data.data.employee);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load employee');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEmployee();
  }, [id]);

  const handleDelete = async () => {
    if (!window.confirm('Delete this employee?')) return;
    try {
      await deleteEmployee(id);
      navigate('/employees');
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to delete employee');
    }
  };

  const toggleTaskStatus = async (index) => {
    if (!employee) return;
    const tasks = employee.onboardingTasks?.map((task, taskIndex) =>
      taskIndex === index
        ? { ...task, status: task.status === 'Completed' ? 'Pending' : 'Completed' }
        : task
    );
    const nextStatus = tasks.every((task) => task.status === 'Completed')
      ? 'Completed'
      : tasks.some((task) => task.status === 'Completed')
      ? 'In Progress'
      : 'Pending';

    setSaving(true);
    setError('');
    try {
      const response = await updateEmployee(id, {
        onboardingTasks: tasks,
        onboardingStatus: nextStatus,
      });
      setEmployee(response.data.data.employee);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to update onboarding tasks');
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (value) => (value ? new Date(value).toLocaleDateString() : '-');

  if (loading) {
    return (
      <Layout>
        <div className="text-center py-5">
          <div className="spinner-border text-primary" />
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

  if (!employee) {
    return (
      <Layout>
        <div className="alert alert-warning">Employee not found.</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="d-flex justify-content-between align-items-start mb-4 gap-3 flex-column flex-md-row">
        <div>
          <h3 className="mb-1">{employee.firstName} {employee.lastName}</h3>
          <p className="text-muted mb-0">Employee profile for {employee.employeeId}</p>
        </div>
        <div className="d-flex gap-2 flex-wrap">
          <Link to={`/employees/${employee._id}/edit`} className="btn btn-outline-primary">Edit</Link>
          <button className="btn btn-danger" onClick={handleDelete}>Delete</button>
        </div>
      </div>

      <div className="row g-4">
        <div className="col-lg-8">
          <div className="card mb-4">
            <div className="card-body">
              <h5 className="card-title">Basic Details</h5>
              <dl className="row mb-0">
                <dt className="col-sm-4">Employee ID</dt>
                <dd className="col-sm-8">{employee.employeeId}</dd>
                <dt className="col-sm-4">Name</dt>
                <dd className="col-sm-8">{employee.firstName} {employee.lastName}</dd>
                <dt className="col-sm-4">Email</dt>
                <dd className="col-sm-8">{employee.email || '-'}</dd>
                <dt className="col-sm-4">Phone</dt>
                <dd className="col-sm-8">{employee.phone || '-'}</dd>
                <dt className="col-sm-4">Department</dt>
                <dd className="col-sm-8">{employee.department || '-'}</dd>
                <dt className="col-sm-4">Designation</dt>
                <dd className="col-sm-8">{employee.designation || '-'}</dd>
                <dt className="col-sm-4">Joining Date</dt>
                <dd className="col-sm-8">{formatDate(employee.joiningDate)}</dd>
                <dt className="col-sm-4">Manager</dt>
                <dd className="col-sm-8">{employee.manager || '-'}</dd>
                <dt className="col-sm-4">Employment Type</dt>
                <dd className="col-sm-8">{employee.employmentType || '-'}</dd>
                <dt className="col-sm-4">Location</dt>
                <dd className="col-sm-8">{employee.location || '-'}</dd>
                <dt className="col-sm-4">Source</dt>
                <dd className="col-sm-8">{employee.source || '-'}</dd>
                <dt className="col-sm-4">Hired Job</dt>
                <dd className="col-sm-8">{employee.hiredJob || '-'}</dd>
                <dt className="col-sm-4">Candidate Record</dt>
                <dd className="col-sm-8">{employee.candidateId ? `${employee.candidateId.firstName} ${employee.candidateId.lastName}` : '-'}</dd>
                <dt className="col-sm-4">Offer</dt>
                <dd className="col-sm-8">{employee.offerId?.offerId || '-'}</dd>
                <dt className="col-sm-4">Onboarding Status</dt>
                <dd className="col-sm-8"><StatusBadge status={employee.onboardingStatus || 'Pending'} /></dd>
              </dl>
            </div>
          </div>

          <div className="card">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div>
                  <h5 className="card-title mb-1">Onboarding Checklist</h5>
                  <p className="small text-muted mb-0">Track onboarding document status.</p>
                </div>
              </div>
              <div className="list-group list-group-flush">
                {employee.onboardingTasks?.map((task, index) => (
                  <div key={index} className="list-group-item d-flex justify-content-between align-items-center gap-3 flex-wrap">
                    <div>
                      <div className="fw-semibold">{task.name}</div>
                      <small className="text-muted">{task.status === 'Completed' ? 'Completed' : 'Pending'}</small>
                    </div>
                    <button
                      type="button"
                      className={`btn btn-sm ${task.status === 'Completed' ? 'btn-outline-secondary' : 'btn-outline-success'}`}
                      onClick={() => toggleTaskStatus(index)}
                      disabled={saving}
                    >
                      {task.status === 'Completed' ? 'Mark Pending' : 'Mark Completed'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-4">
          <div className="card mb-4">
            <div className="card-body">
              <h5 className="card-title">Record Summary</h5>
              <dl className="row mb-0">
                <dt className="col-sm-6">Created At</dt>
                <dd className="col-sm-6">{formatDate(employee.createdAt)}</dd>
                <dt className="col-sm-6">Updated At</dt>
                <dd className="col-sm-6">{formatDate(employee.updatedAt)}</dd>
              </dl>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default EmployeeDetails;
