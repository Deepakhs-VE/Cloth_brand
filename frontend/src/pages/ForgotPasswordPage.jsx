import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowRight, CheckCircle } from 'lucide-react';
import api from '../services/api';

export const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [devToken, setDevToken] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await api.post('/auth/forgot-password', { email });
      if (res.data.success) {
        setSubmitted(true);
        if (res.data.devResetToken) {
          setDevToken(res.data.devResetToken);
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error processing request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-16 px-4 bg-[#fcfbfa]">
      <div className="w-full max-w-md bg-white p-8 sm:p-10 rounded-3xl border border-slate-100 shadow-xl space-y-6">
        <div className="text-center space-y-2">
          <h1 className="font-luxury text-2xl sm:text-3xl font-extrabold text-slate-900">
            Password Recovery
          </h1>
          <p className="text-xs text-slate-500">
            Enter your registered email address to receive secure reset instructions
          </p>
        </div>

        {submitted ? (
          <div className="text-center space-y-4 py-4">
            <CheckCircle className="w-12 h-12 text-emerald-600 mx-auto" />
            <p className="text-sm font-semibold text-slate-900">Instructions Dispatched</p>
            <p className="text-xs text-slate-500">
              If an account is associated with {email}, you will receive a reset link shortly.
            </p>

            {devToken && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-left text-xs">
                <p className="font-bold text-amber-800">Development Fast Link:</p>
                <Link
                  to={`/reset-password?token=${devToken}`}
                  className="text-amber-700 underline break-all mt-1 block font-mono text-[11px]"
                >
                  Click here to set new password immediately
                </Link>
              </div>
            )}

            <div className="pt-4">
              <Link to="/login" className="text-xs uppercase tracking-wider font-bold text-slate-900 hover:underline">
                Return to Login
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
                {error}
              </div>
            )}

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="patron@domain.com"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white text-xs uppercase tracking-widest font-bold rounded-xl transition shadow-md flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              <span>{loading ? 'Processing...' : 'Send Recovery Link'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        <div className="text-center pt-2 border-t border-slate-100">
          <Link to="/login" className="text-xs text-slate-500 hover:text-slate-800 transition">
            Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};
