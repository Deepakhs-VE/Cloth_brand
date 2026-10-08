import React, { useState } from 'react';
import { Mail, Phone, MapPin, Clock, MessageCircle, Send, CheckCircle } from 'lucide-react';
import api from '../services/api';
import { useSettings } from '../context/SettingsContext';
import { InternationalPhoneInput, isPhoneValid } from '../components/common/InternationalPhoneInput';

export const ContactPage = () => {
  const { settings } = useSettings();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const contactInfo = settings?.contactInfo || {
    email: 'concierge@aurastore.com',
    phone: '+91 6366592991',
    whatsappNumber: '+91 6366592991',
    address: '450 Lexington Avenue, Suite 1800, New York, NY 10017',
    workingHours: 'Mon - Sat: 9:00 AM - 8:00 PM EST',
  };

  const whatsappClean = (contactInfo.whatsappNumber || '18008922872').replace(/[^0-9]/g, '');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    if (!isPhoneValid(formData.phone)) {
      setErrorMsg('Enter a valid phone number including the country code');
      setSubmitting(false);
      return;
    }

    try {
      const res = await api.post('/contact', formData);
      if (res.data.success) {
        setSuccessMsg(res.data.message || 'Thank you! Our concierge will respond shortly.');
        setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to dispatch message. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-[#fcfbfa] min-h-screen py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto">
          <p className="text-xs uppercase font-bold tracking-widest text-amber-600 mb-2">
            Private Concierge
          </p>
          <h1 className="font-luxury text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight mb-4">
            Connect with Our Specialists
          </h1>
          <p className="text-sm text-slate-500 leading-relaxed">
            Whether inquiring about bespoke timepiece allocations, leather care, or corporate commissions, our advisory team awaits your message.
          </p>
        </div>

        {/* Contact Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Contact Details Card */}
          <div className="bg-slate-900 text-white p-8 sm:p-10 rounded-3xl shadow-xl flex flex-col justify-between space-y-8">
            <div className="space-y-6">
              <h2 className="font-luxury text-2xl font-bold text-white">The Atelier Desk</h2>
              <p className="text-xs text-slate-300 leading-relaxed">
                Direct client assistance is available six days weekly for global patrons.
              </p>

              <div className="space-y-5 text-xs text-slate-300 pt-2">
                <div className="flex items-start space-x-3">
                  <MapPin className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-white">Mailing Address</p>
                    <p className="text-slate-400 mt-0.5">{contactInfo.address}</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Phone className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-white">Telephone</p>
                    <p className="text-slate-400 mt-0.5">{contactInfo.phone}</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Mail className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-white">Email Inquiries</p>
                    <p className="text-slate-400 mt-0.5">{contactInfo.email}</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Clock className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-white">Operating Hours</p>
                    <p className="text-slate-400 mt-0.5">{contactInfo.workingHours}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Direct WhatsApp Action */}
            <div className="pt-6 border-t border-slate-800">
              <a
                href={`https://wa.me/${whatsappClean}?text=${encodeURIComponent('Hello Concierge, I would like to inquire about an order.')}`}
                target="_blank"
                rel="noreferrer"
                className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs uppercase tracking-wider font-bold transition flex items-center justify-center space-x-2 shadow-lg"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Instant Chat on WhatsApp</span>
              </a>
            </div>
          </div>

          {/* Inquiry Form */}
          <div className="lg:col-span-2 bg-white p-8 sm:p-12 rounded-3xl border border-slate-100 shadow-sm">
            <h3 className="font-luxury text-2xl font-bold text-slate-900 mb-6">Send an Inquiry</h3>

            {successMsg ? (
              <div className="py-12 text-center space-y-4">
                <CheckCircle className="w-14 h-14 text-emerald-600 mx-auto" />
                <h4 className="text-lg font-bold text-slate-900">Message Dispatched</h4>
                <p className="text-xs text-slate-600 max-w-md mx-auto">{successMsg}</p>
                <button
                  onClick={() => setSuccessMsg('')}
                  className="mt-4 px-6 py-2.5 bg-slate-900 text-white text-xs uppercase tracking-wider font-semibold rounded-lg"
                >
                  Send Another Inquiry
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                {errorMsg && (
                  <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
                    {errorMsg}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1.5">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. Julian Sterling"
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-slate-900"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1.5">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="patron@domain.com"
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-slate-900"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1.5">
                      Contact Phone
                    </label>
                    <InternationalPhoneInput
                      value={formData.phone}
                      onChange={(phone) => setFormData({ ...formData, phone })}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1.5">
                      Subject *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      placeholder="e.g. Allocation inquiry / Order support"
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-slate-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1.5">
                    Your Message *
                  </label>
                  <textarea
                    rows={5}
                    required
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="How may our concierge assist your requirements?"
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full sm:w-auto px-8 py-3.5 bg-slate-900 hover:bg-slate-800 text-white text-xs uppercase tracking-widest font-bold rounded-xl transition flex items-center justify-center space-x-2 shadow-md disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  <span>{submitting ? 'Dispatching...' : 'Dispatch Inquiry'}</span>
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
