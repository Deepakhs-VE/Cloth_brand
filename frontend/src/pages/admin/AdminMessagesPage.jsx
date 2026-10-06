import React, { useState, useEffect } from 'react';
import { Mail, Clock, CheckCircle, MessageSquare, Trash2, Edit2 } from 'lucide-react';
import api from '../../services/api';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { Modal } from '../../components/common/Modal';

export const AdminMessagesPage = () => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedMessage, setSelectedMessage] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [newStatus, setNewStatus] = useState('NEW');
  const [replyNote, setReplyNote] = useState('');

  const loadMessages = async () => {
    try {
      setLoading(true);
      const res = await api.get('/contact');
      if (res.data.success) {
        setMessages(res.data.messages);
      }
    } catch (err) {
      console.error('Error loading messages:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMessages();
  }, []);

  const handleOpenDetail = (msg) => {
    setSelectedMessage(msg);
    setNewStatus(msg.status);
    setReplyNote(msg.adminReplyNote || '');
    setModalOpen(true);
  };

  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    try {
      await api.patch(`/contact/${selectedMessage._id}/status`, {
        status: newStatus,
        adminReplyNote: replyNote,
      });
      await loadMessages();
      setModalOpen(false);
    } catch (err) {
      alert(err.response?.data?.message || 'Error updating status');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this message inquiry?')) {
      try {
        await api.delete(`/contact/${id}`);
        await loadMessages();
      } catch (err) {
        alert(err.response?.data?.message || 'Error deleting message');
      }
    }
  };

  const statusBadge = (s) => {
    const styles = {
      NEW: 'bg-blue-50 text-blue-700 border-blue-200',
      READ: 'bg-amber-50 text-amber-700 border-amber-200',
      IN_PROGRESS: 'bg-purple-50 text-purple-700 border-purple-200',
      RESOLVED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    };
    return (
      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${styles[s] || ''}`}>
        {s.replace(/_/g, ' ')}
      </span>
    );
  };

  return (
    <AdminLayout title="Client Inquiries & Support Tickets">
      <div className="space-y-6">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <p className="text-xs text-slate-500 font-medium">
            Customer inquiries and concierge message requests from contact form
          </p>
          <span className="text-xs font-bold text-slate-900 bg-slate-100 px-3 py-1 rounded-full">
            {messages.length} Total Messages
          </span>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-4 px-6">Patron</th>
                  <th className="py-4 px-4">Subject</th>
                  <th className="py-4 px-4">Date</th>
                  <th className="py-4 px-4">Status</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {messages.map((m) => (
                  <tr key={m._id} className="hover:bg-slate-50/70 transition">
                    <td className="py-4 px-6">
                      <p className="font-bold text-slate-900">{m.name}</p>
                      <p className="text-[10px] text-slate-400">{m.email} {m.phone ? `• ${m.phone}` : ''}</p>
                    </td>
                    <td className="py-4 px-4 font-semibold text-slate-800 max-w-xs truncate">
                      {m.subject}
                    </td>
                    <td className="py-4 px-4 text-slate-500">
                      {new Date(m.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-4 px-4">{statusBadge(m.status)}</td>
                    <td className="py-4 px-6 text-right space-x-2">
                      <button
                        onClick={() => handleOpenDetail(m)}
                        className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-[11px] font-bold uppercase transition"
                      >
                        Inspect
                      </button>
                      <button
                        onClick={() => handleDelete(m._id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Inspect / Reply Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={selectedMessage ? `Inquiry from ${selectedMessage.name}` : ''}
      >
        {selectedMessage && (
          <form onSubmit={handleUpdateStatus} className="space-y-4">
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-xs space-y-2">
              <p><strong className="text-slate-800">Email:</strong> {selectedMessage.email}</p>
              {selectedMessage.phone && <p><strong className="text-slate-800">Phone:</strong> {selectedMessage.phone}</p>}
              <p><strong className="text-slate-800">Subject:</strong> {selectedMessage.subject}</p>
              <div className="pt-2 border-t border-slate-200">
                <p className="font-bold text-slate-800 mb-1">Message:</p>
                <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">{selectedMessage.message}</p>
              </div>
            </div>

            <div>
              <label className="text-[10px] uppercase font-bold text-slate-700 block mb-1">
                Inquiry Status *
              </label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
              >
                <option value="NEW">NEW</option>
                <option value="READ">READ</option>
                <option value="IN_PROGRESS">IN PROGRESS</option>
                <option value="RESOLVED">RESOLVED</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] uppercase font-bold text-slate-700 block mb-1">
                Internal Concierge Notes
              </label>
              <textarea
                rows={3}
                value={replyNote}
                onChange={(e) => setReplyNote(e.target.value)}
                placeholder="Log internal action taken or email follow-up notes..."
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs uppercase tracking-wider font-bold transition shadow-md"
            >
              Update Ticket
            </button>
          </form>
        )}
      </Modal>
    </AdminLayout>
  );
};
