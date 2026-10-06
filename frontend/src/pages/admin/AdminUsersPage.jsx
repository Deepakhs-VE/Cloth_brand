import React, { useState, useEffect } from 'react';
import { Users, Search, Shield, Ban, CheckCircle } from 'lucide-react';
import api from '../../services/api';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { Pagination } from '../../components/common/Pagination';

export const AdminUsersPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const res = await api.get(
        `/admin/users?page=${page}&limit=15&search=${encodeURIComponent(search)}`
      );
      if (res.data.success) {
        setUsers(res.data.users);
        setTotalPages(res.data.pages || 1);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [page, search]);

  const handleToggleBlock = async (user) => {
    try {
      await api.patch(`/admin/users/${user._id}/status`, {
        isBlocked: !user.isBlocked,
      });
      await loadUsers();
    } catch (err) {
      alert(err.response?.data?.message || 'Error updating user status');
    }
  };

  const handleToggleRole = async (user) => {
    const targetRole = user.role === 'admin' ? 'customer' : 'admin';
    if (window.confirm(`Are you sure you want to change ${user.name}'s role to ${targetRole}?`)) {
      try {
        await api.patch(`/admin/users/${user._id}/status`, {
          role: targetRole,
        });
        await loadUsers();
      } catch (err) {
        alert(err.response?.data?.message || 'Error updating user role');
      }
    }
  };

  return (
    <AdminLayout title="Client & User Directory">
      <div className="space-y-6">
        <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="relative flex-1 max-w-md">
            <input
              type="text"
              placeholder="Search by client name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-slate-900"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-4 px-6">Patron</th>
                  <th className="py-4 px-4">Contact Email</th>
                  <th className="py-4 px-4">Role</th>
                  <th className="py-4 px-4">Account Status</th>
                  <th className="py-4 px-4">Joined Date</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => (
                  <tr key={u._id} className="hover:bg-slate-50/70 transition">
                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-slate-900 text-white font-bold flex items-center justify-center text-xs">
                          {u.name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{u.name}</p>
                          <p className="text-[10px] text-slate-400">{u.phone || 'No phone'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-slate-600 font-medium">{u.email}</td>
                    <td className="py-4 px-4">
                      <button
                        onClick={() => handleToggleRole(u)}
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase transition ${
                          u.role === 'admin'
                            ? 'bg-amber-100 text-amber-800 border border-amber-300'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                        title="Click to toggle role"
                      >
                        {u.role}
                      </button>
                    </td>
                    <td className="py-4 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          u.isBlocked
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-emerald-50 text-emerald-700'
                        }`}
                      >
                        {u.isBlocked ? 'Blocked' : 'Active'}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-slate-500">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-4 px-6 text-right space-x-2">
                      <button
                        onClick={() => handleToggleBlock(u)}
                        className={`px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase transition ${
                          u.isBlocked
                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                            : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {u.isBlocked ? 'Unblock' : 'Deactivate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-4 border-t border-slate-100">
            <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};
