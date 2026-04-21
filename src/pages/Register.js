import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import './Auth.css';

const Register = () => {
  const { register, user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
    empId: '',
  });
  const [loading, setLoading] = useState(false);

  if (user) {
    navigate('/dashboard', { replace: true });
    return null;
  }

  // Password strength validation function
  const validatePasswordStrength = (pwd) => {
    const hasUppercase = /[A-Z]/.test(pwd); 
    const hasLowercase = /[a-z]/.test(pwd); 
    const hasNumber = /[0-9]/.test(pwd); 
    const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pwd); 
    return {
      hasUppercase,
      hasLowercase,
      hasNumber,
      hasSpecialChar,
      isStrong: hasUppercase && hasLowercase && hasNumber && hasSpecialChar,
    };
  };

  // Get password strength feedback
  const getPasswordStrengthFeedback = () => {
    const strength = validatePasswordStrength(form.password);
    const issues = [];
    if (!strength.hasUppercase) issues.push('uppercase letter');
    if (!strength.hasLowercase) issues.push('lowercase letter');
    if (!strength.hasNumber) issues.push('number');
    if (!strength.hasSpecialChar) issues.push('special character');
    return issues;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Password strength validation
    const strength = validatePasswordStrength(form.password);
    if (!strength.isStrong) {
      const issues = getPasswordStrengthFeedback();
      toast.error(`Password must contain: ${issues.join(', ')}`);
      return;
    }

    if (form.password !== form.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (form.password.length < 8) {
      toast.error('Password must be at least 8 characters long');
      return;
    }

    if(form.password.length > 100) {
      toast.error('Password must be less than 100 characters long');
      return;
    }

    if(form.password.toLowerCase().includes('password')) {
      toast.error('Password should not contain the word "password"');
      return;
    }

    if(form.password.toLowerCase().includes(form.username.toLowerCase())) {
      toast.error('Password should not contain your username');
      return;
    }
    
    setLoading(true);
    try {
      await register(form.email, form.username, form.password, Number(form.empId));
      toast.success('Account created! Please sign in.');
      navigate('/login');
    } catch (err) {
      const msg = err.response?.data || 'Registration failed';
      toast.error(typeof msg === 'string' ? msg : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <span className="auth-logo">🔔</span>
          <h1>Create Account</h1>
          <p>Register for the Reminder App</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email</label>
            <input
              className="form-control"
              type="email"
              placeholder="you@company.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label>Username</label>
            <input
              className="form-control"
              type="text"
              placeholder="John Doe"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label>Employee ID</label>
            <input
              className="form-control"
              type="number"
              placeholder="12345"
              value={form.empId}
              onChange={(e) => setForm({ ...form, empId: e.target.value })}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Password</label>
              <input
                className="form-control"
                type="password"
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
                minLength={6}
              />
              {form.password && (
                <div className="password-strength">
                  {(() => {
                    const strength = validatePasswordStrength(form.password);
                    return (
                      <>
                        <div className={`strength-indicator ${strength.isStrong ? 'strong' : 'weak'}`}>
                          <span className={strength.hasUppercase ? 'met' : 'unmet'}>UpperCase</span>
                          <span className={strength.hasLowercase ? 'met' : 'unmet'}>LowerCase</span>
                          <span className={strength.hasNumber ? 'met' : 'unmet'}>Number</span>
                          <span className={strength.hasSpecialChar ? 'met' : 'unmet'}>SpecialChar</span>
                        </div>
                        <small className={strength.isStrong ? 'text-success' : 'text-warning'}>
                          {strength.isStrong ? '✓ Strong password' : '⚠ Weak password'}
                        </small>
                      </>
                    );
                  })()}
                </div>
              )}
            </div>

            <div className="form-group">
              <label>Confirm Password</label>
              <input
                className="form-control"
                type="password"
                placeholder="••••••••"
                value={form.confirmPassword}
                onChange={(e) =>
                  setForm({ ...form, confirmPassword: e.target.value })
                }
                required
                minLength={6}
              />
            </div>
          </div>

          <button className="btn btn-primary auth-submit" disabled={loading}>
            {loading ? 'Creating account…' : 'Create Account'}
          </button>
        </form>

        <p className="auth-footer">
          Already have an account? <Link to="/login">Sign In</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
