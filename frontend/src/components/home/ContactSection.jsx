import React, { useState } from 'react';
import { Mail, MapPin, MessageCircle, Phone, Send } from 'lucide-react';
import api from '../../services/api';
import { useSettings } from '../../context/SettingsContext';

export const ContactSection = () => {
  const { settings } = useSettings();
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [status, setStatus] = useState({ type: '', message: '' });
  const [submitting, setSubmitting] = useState(false);

  const contact = settings?.contactInfo || {};
  const whatsappNumber = (contact.whatsappNumber || '').replace(/\D/g, '');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setStatus({ type: '', message: '' });

    try {
      const response = await api.post('/contact', form);
      setStatus({ type: 'success', message: response.data.message });
      setForm({ name: '', email: '', subject: '', message: '' });
    } catch (error) {
      setStatus({
        type: 'error',
        message: error.response?.data?.message || 'We could not send your message. Please try again.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section id="contact" className="bg-slate-950 text-white py-20 sm:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-5 gap-10 lg:gap-16 items-start">
          <div className="lg:col-span-2 space-y-6">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] font-bold text-amber-400">Private client care</p>
              <h2 className="font-luxury text-3xl sm:text-4xl font-extrabold mt-3">Contact Our Concierge</h2>
              <p className="text-sm text-slate-400 leading-relaxed mt-4">
                Questions about sizing, delivery, products, or an existing order? Our team will respond with personal assistance.
              </p>
            </div>

            <div className="space-y-4 text-sm text-slate-300">
              {contact.email && <a href={`mailto:${contact.email}`} className="flex items-center gap-3 hover:text-white transition"><Mail className="w-4 h-4 text-amber-400" />{contact.email}</a>}
              {contact.phone && <a href={`tel:${contact.phone}`} className="flex items-center gap-3 hover:text-white transition"><Phone className="w-4 h-4 text-amber-400" />{contact.phone}</a>}
              {contact.address && <p className="flex items-start gap-3"><MapPin className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />{contact.address}</p>}
            </div>

            {whatsappNumber && (
              <a
                href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent('Hello, I would like assistance with AURA.')}`}
                target="_blank"
                rel="noreferrer"
                className="pressable inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs uppercase tracking-wider font-bold transition"
              >
                <MessageCircle className="w-4 h-4" /> WhatsApp Us
              </a>
            )}
          </div>

          <form onSubmit={handleSubmit} className="lg:col-span-3 bg-white text-slate-900 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <input required aria-label="Full name" placeholder="Full name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/20" />
              <input required type="email" aria-label="Email address" placeholder="Email address" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/20" />
            </div>
            <input required aria-label="Subject" placeholder="How can we help?" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} className="w-full p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/20" />
            <textarea required rows={5} aria-label="Message" placeholder="Tell us what you need..." value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} className="w-full p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-slate-900/20" />

            {status.message && (
              <p className={`text-xs p-3 rounded-xl ${status.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`} role="status">
                {status.message}
              </p>
            )}

            <button disabled={submitting} className="pressable inline-flex items-center justify-center gap-2 w-full sm:w-auto px-7 py-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs uppercase tracking-widest font-bold transition disabled:opacity-60">
              <Send className="w-4 h-4" /> {submitting ? 'Sending...' : 'Send Message'}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
};
