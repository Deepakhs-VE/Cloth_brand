import React, { useState, useEffect } from 'react';
import { MapPin, Plus, Trash2, Edit2, CheckCircle2 } from 'lucide-react';
import api from '../services/api';
import { Modal } from '../components/common/Modal';
import { InternationalPhoneInput, isPhoneValid } from '../components/common/InternationalPhoneInput';
import { useApplicationAlert } from '../context/ApplicationAlertContext';

export const AddressesPage = () => {
  const { showAlert, showConfirm } = useApplicationAlert();
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);

  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    streetAddress: '',
    apartment: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'United States',
    isDefault: false,
    addressType: 'home',
  });

  const loadAddresses = async () => {
    try {
      setLoading(true);
      const res = await api.get('/users/addresses');
      if (res.data.success) {
        setAddresses(res.data.addresses);
      }
    } catch (err) {
      console.error('Error loading addresses:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAddresses();
  }, []);

  const handleOpenAdd = () => {
    setEditingAddress(null);
    setFormData({
      fullName: '',
      phone: '',
      streetAddress: '',
      apartment: '',
      city: '',
      state: '',
      postalCode: '',
      country: 'United States',
      isDefault: false,
      addressType: 'home',
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (addr) => {
    setEditingAddress(addr);
    setFormData({
      fullName: addr.fullName,
      phone: addr.phone,
      streetAddress: addr.streetAddress,
      apartment: addr.apartment || '',
      city: addr.city,
      state: addr.state,
      postalCode: addr.postalCode,
      country: addr.country,
      isDefault: addr.isDefault,
      addressType: addr.addressType || 'home',
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isPhoneValid(formData.phone, true)) {
      showAlert('Enter a valid contact phone number including the country code.', {
        type: 'warning',
        title: 'Invalid Phone Number',
      });
      return;
    }
    try {
      if (editingAddress) {
        await api.put(`/users/addresses/${editingAddress._id}`, formData);
      } else {
        await api.post('/users/addresses', formData);
      }
      await loadAddresses();
      setModalOpen(false);
    } catch (err) {
      showAlert(err.response?.data?.message || 'Error saving address');
    }
  };

  const handleDelete = async (id) => {
    const confirmed = await showConfirm('This saved address will be permanently removed.', {
      title: 'Delete Address?',
      confirmLabel: 'Delete Address',
    });
    if (confirmed) {
      try {
        await api.delete(`/users/addresses/${id}`);
        await loadAddresses();
      } catch (err) {
        console.error('Error deleting address:', err);
      }
    }
  };

  const handleSetDefault = async (id) => {
    try {
      await api.put(`/users/addresses/${id}/default`);
      await loadAddresses();
    } catch (err) {
      console.error('Error setting default:', err);
    }
  };

  return (
    <div className="bg-[#fcfbfa] min-h-screen py-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-200 gap-4">
          <div>
            <h1 className="font-luxury text-3xl font-extrabold text-slate-900">
              Saved Addresses
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Manage your residential and corporate delivery destinations
            </p>
          </div>

          <button
            onClick={handleOpenAdd}
            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs uppercase tracking-wider font-bold transition flex items-center space-x-1.5 shadow-sm self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Add Destination</span>
          </button>
        </div>

        {/* Address cards grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="h-44 bg-white rounded-3xl border border-slate-100 animate-pulse" />
            ))}
          </div>
        ) : addresses.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {addresses.map((addr) => (
              <div
                key={addr._id}
                className={`bg-white p-6 sm:p-8 rounded-3xl border transition flex flex-col justify-between shadow-sm relative ${
                  addr.isDefault ? 'border-slate-900 shadow-md ring-1 ring-slate-900' : 'border-slate-100 hover:border-slate-300'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                      {addr.addressType}
                    </span>
                    {addr.isDefault ? (
                      <span className="flex items-center text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                        <CheckCircle2 className="w-3 h-3 mr-1" /> Default Destination
                      </span>
                    ) : (
                      <button
                        onClick={() => handleSetDefault(addr._id)}
                        className="text-[10px] text-amber-700 hover:underline font-bold"
                      >
                        Set as Default
                      </button>
                    )}
                  </div>

                  <h3 className="font-bold text-sm text-slate-900">{addr.fullName}</h3>
                  <div className="text-xs text-slate-600 mt-2 space-y-0.5">
                    <p>{addr.streetAddress}</p>
                    {addr.apartment && <p>{addr.apartment}</p>}
                    <p>
                      {addr.city}, {addr.state} {addr.postalCode}
                    </p>
                    <p>{addr.country}</p>
                    <p className="text-slate-400 pt-1">Tel: {addr.phone}</p>
                  </div>
                </div>

                <div className="pt-4 mt-6 border-t border-slate-100 flex items-center justify-end space-x-3 text-xs">
                  <button
                    onClick={() => handleOpenEdit(addr)}
                    className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition"
                    title="Edit address"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(addr._id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                    title="Delete address"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-16 text-center bg-white rounded-3xl border border-slate-100">
            <MapPin className="w-12 h-12 text-slate-300 mx-auto mb-3 stroke-1" />
            <h3 className="text-sm font-bold text-slate-900 mb-1">No addresses saved</h3>
            <p className="text-xs text-slate-400 mb-6">Add an address for seamless 1-click checkout.</p>
            <button
              onClick={handleOpenAdd}
              className="px-6 py-2.5 bg-slate-900 text-white rounded-xl text-xs uppercase font-bold"
            >
              Add First Address
            </button>
          </div>
        )}
      </div>

      {/* Address Form Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingAddress ? 'Edit Address' : 'New Address'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] uppercase font-bold text-slate-700 block mb-1">
                Full Name *
              </label>
              <input
                type="text"
                required
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
              />
            </div>
            <div>
              <label className="text-[10px] uppercase font-bold text-slate-700 block mb-1">
                Phone *
              </label>
              <InternationalPhoneInput
                required
                value={formData.phone}
                onChange={(phone) => setFormData({ ...formData, phone })}
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] uppercase font-bold text-slate-700 block mb-1">
              Street Address *
            </label>
            <input
              type="text"
              required
              value={formData.streetAddress}
              onChange={(e) => setFormData({ ...formData, streetAddress: e.target.value })}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
            />
          </div>

          <div>
            <label className="text-[10px] uppercase font-bold text-slate-700 block mb-1">
              Apartment, Suite, Unit
            </label>
            <input
              type="text"
              value={formData.apartment}
              onChange={(e) => setFormData({ ...formData, apartment: e.target.value })}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-[10px] uppercase font-bold text-slate-700 block mb-1">
                City *
              </label>
              <input
                type="text"
                required
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
              />
            </div>
            <div>
              <label className="text-[10px] uppercase font-bold text-slate-700 block mb-1">
                State *
              </label>
              <input
                type="text"
                required
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
              />
            </div>
            <div>
              <label className="text-[10px] uppercase font-bold text-slate-700 block mb-1">
                Postal Code *
              </label>
              <input
                type="text"
                required
                value={formData.postalCode}
                onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2 pt-2">
            <input
              type="checkbox"
              id="isDefaultCheck"
              checked={formData.isDefault}
              onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
              className="w-4 h-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
            />
            <label htmlFor="isDefaultCheck" className="text-xs text-slate-700 font-medium cursor-pointer">
              Set as my default destination
            </label>
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-slate-900 text-white rounded-xl text-xs uppercase tracking-wider font-bold hover:bg-slate-800 transition"
          >
            {editingAddress ? 'Update Destination' : 'Save Destination'}
          </button>
        </form>
      </Modal>
    </div>
  );
};
