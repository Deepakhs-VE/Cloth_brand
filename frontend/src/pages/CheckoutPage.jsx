import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ShieldCheck,
  CreditCard,
  MapPin,
  Tag,
  CheckCircle,
  Truck,
  Plus,
  AlertCircle,
  Lock,
} from 'lucide-react';
import api from '../services/api';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { Modal } from '../components/common/Modal';

export const CheckoutPage = () => {
  const navigate = useNavigate();
  const { cart, fetchCart } = useCart();
  const { user } = useAuth();

  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('card_online');
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);

  // New Address inline modal
  const [addAddressModalOpen, setAddAddressModalOpen] = useState(false);
  const [newAddress, setNewAddress] = useState({
    fullName: user?.name || '',
    phone: user?.phone || '',
    streetAddress: '',
    apartment: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'United States',
    isDefault: true,
  });

  // Card details state
  const [cardDetails, setCardDetails] = useState({
    cardNumber: '4242 •••• •••• 4242',
    cardExpiry: '12/28',
    cardCvc: '888',
    cardName: user?.name || 'Alexander Sterling',
  });

  const [placingOrder, setPlacingOrder] = useState(false);
  const [orderError, setOrderError] = useState('');

  // Fetch saved addresses
  const loadAddresses = async () => {
    try {
      const res = await api.get('/users/addresses');
      if (res.data.success) {
        setAddresses(res.data.addresses);
        const defaultAddr = res.data.addresses.find((a) => a.isDefault);
        if (defaultAddr) {
          setSelectedAddressId(defaultAddr._id);
        } else if (res.data.addresses.length > 0) {
          setSelectedAddressId(res.data.addresses[0]._id);
        }
      }
    } catch (err) {
      console.error('Error fetching addresses:', err);
    }
  };

  useEffect(() => {
    loadAddresses();
  }, []);

  // Save new address
  const handleSaveAddress = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/users/addresses', newAddress);
      if (res.data.success) {
        await loadAddresses();
        setSelectedAddressId(res.data.address._id);
        setAddAddressModalOpen(false);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error saving address');
    }
  };

  // Validate coupon server-side
  const handleApplyCoupon = async (e) => {
    e.preventDefault();
    if (!couponCode.trim()) return;

    setCouponLoading(true);
    setCouponError('');

    try {
      const res = await api.post('/coupons/validate', {
        code: couponCode,
        cartTotal: cart.subtotal,
      });

      if (res.data.success) {
        setAppliedCoupon(res.data.coupon);
        setCouponError('');
      }
    } catch (err) {
      setAppliedCoupon(null);
      setCouponError(err.response?.data?.message || 'Invalid coupon code');
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
  };

  // Calculations
  const subtotal = cart.subtotal || 0;
  const discountAmount = appliedCoupon ? appliedCoupon.discountAmount : 0;
  const shippingAmount = subtotal >= 150 ? 0 : 15.0;
  const taxAmount = Math.round((subtotal - discountAmount) * 0.05 * 100) / 100;
  const totalAmount = Math.max(0, subtotal - discountAmount + shippingAmount + taxAmount);

  // Submit Order
  const handlePlaceOrder = async () => {
    if (!selectedAddressId) {
      setOrderError('Please select or add a shipping address');
      return;
    }

    const addressObj = addresses.find((a) => a._id === selectedAddressId);
    if (!addressObj) {
      setOrderError('Selected address not found');
      return;
    }

    setPlacingOrder(true);
    setOrderError('');

    try {
      // 1. Create order
      const orderRes = await api.post('/orders', {
        shippingAddress: {
          fullName: addressObj.fullName,
          phone: addressObj.phone,
          streetAddress: addressObj.streetAddress,
          apartment: addressObj.apartment,
          city: addressObj.city,
          state: addressObj.state,
          postalCode: addressObj.postalCode,
          country: addressObj.country,
        },
        paymentMethod,
        couponCode: appliedCoupon ? appliedCoupon.code : null,
      });

      if (orderRes.data.success) {
        const order = orderRes.data.order;

        // 2. If online payment, verify with payment processing API
        if (paymentMethod !== 'cod') {
          await api.post('/payments/process', {
            orderId: order._id,
            paymentMethod,
            paymentDetails: cardDetails,
          });
        }

        // 3. Refresh user cart
        await fetchCart();

        // 4. Redirect to confirmation page
        navigate(`/order-success/${order._id}`, { state: { order } });
      }
    } catch (err) {
      setOrderError(err.response?.data?.message || 'Error completing checkout');
    } finally {
      setPlacingOrder(false);
    }
  };

  if (!cart.items || cart.items.length === 0) {
    return (
      <div className="py-24 text-center">
        <h2 className="text-xl font-bold text-slate-900 mb-2">Your Bag is Empty</h2>
        <Link to="/products" className="text-xs uppercase tracking-wider font-bold text-amber-700 underline">
          Explore Creations
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-[#fcfbfa] min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="font-luxury text-3xl font-extrabold text-slate-900 mb-8">
          Express Checkout
        </h1>

        {orderError && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-2xl flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{orderError}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Main Checkout Columns: Address & Payment */}
          <div className="lg:col-span-2 space-y-8">
            {/* Step 1: Shipping Address */}
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-bold">
                    1
                  </div>
                  <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                    Shipping Destination
                  </h2>
                </div>
                <button
                  onClick={() => setAddAddressModalOpen(true)}
                  className="inline-flex items-center space-x-1 text-xs text-amber-600 hover:text-amber-700 font-bold"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add New Address</span>
                </button>
              </div>

              {addresses.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {addresses.map((addr) => (
                    <div
                      key={addr._id}
                      onClick={() => setSelectedAddressId(addr._id)}
                      className={`p-4 rounded-2xl border cursor-pointer transition relative ${
                        selectedAddressId === addr._id
                          ? 'border-slate-900 bg-slate-50/70 shadow-sm'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      {addr.isDefault && (
                        <span className="absolute top-3 right-3 text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-bold uppercase">
                          Default
                        </span>
                      )}
                      <p className="font-bold text-xs text-slate-900">{addr.fullName}</p>
                      <p className="text-xs text-slate-600 mt-1">{addr.streetAddress}</p>
                      {addr.apartment && <p className="text-xs text-slate-500">{addr.apartment}</p>}
                      <p className="text-xs text-slate-600">
                        {addr.city}, {addr.state} {addr.postalCode}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-2">{addr.phone}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center border-2 border-dashed border-slate-200 rounded-2xl">
                  <p className="text-xs text-slate-500 mb-3">No saved addresses on file.</p>
                  <button
                    onClick={() => setAddAddressModalOpen(true)}
                    className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold"
                  >
                    Add Shipping Address
                  </button>
                </div>
              )}
            </div>

            {/* Step 2: Payment Gateway Selection */}
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-bold">
                  2
                </div>
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                  Payment Method
                </h2>
              </div>

              {/* Payment Methods Options */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('card_online')}
                  className={`p-4 rounded-2xl border text-left transition flex flex-col justify-between ${
                    paymentMethod === 'card_online'
                      ? 'border-slate-900 bg-slate-50/70 shadow-sm'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <CreditCard className="w-5 h-5 text-slate-900 mb-2" />
                  <p className="text-xs font-bold text-slate-900">Credit / Debit Card</p>
                  <p className="text-[10px] text-slate-400">Instant 256-Bit SSL</p>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('stripe')}
                  className={`p-4 rounded-2xl border text-left transition flex flex-col justify-between ${
                    paymentMethod === 'stripe'
                      ? 'border-slate-900 bg-slate-50/70 shadow-sm'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <ShieldCheck className="w-5 h-5 text-indigo-600 mb-2" />
                  <p className="text-xs font-bold text-slate-900">Stripe Gateway</p>
                  <p className="text-[10px] text-slate-400">Server Verified</p>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('cod')}
                  className={`p-4 rounded-2xl border text-left transition flex flex-col justify-between ${
                    paymentMethod === 'cod'
                      ? 'border-slate-900 bg-slate-50/70 shadow-sm'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <Truck className="w-5 h-5 text-emerald-600 mb-2" />
                  <p className="text-xs font-bold text-slate-900">Courier COD</p>
                  <p className="text-[10px] text-slate-400">Pay on Delivery</p>
                </button>
              </div>

              {/* Card Inputs Form Preview */}
              {paymentMethod !== 'cod' && (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-4">
                  <div className="flex items-center justify-between text-xs text-slate-600">
                    <span className="font-semibold">Secure Payment Verification</span>
                    <span className="flex items-center text-emerald-600 text-[11px] font-bold">
                      <Lock className="w-3.5 h-3.5 mr-1" /> Encrypted
                    </span>
                  </div>

                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">
                      Card Number
                    </label>
                    <input
                      type="text"
                      value={cardDetails.cardNumber}
                      onChange={(e) => setCardDetails({ ...cardDetails, cardNumber: e.target.value })}
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-mono"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">
                        Expiry Date
                      </label>
                      <input
                        type="text"
                        value={cardDetails.cardExpiry}
                        onChange={(e) => setCardDetails({ ...cardDetails, cardExpiry: e.target.value })}
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">
                        Security CVC
                      </label>
                      <input
                        type="password"
                        value={cardDetails.cardCvc}
                        onChange={(e) => setCardDetails({ ...cardDetails, cardCvc: e.target.value })}
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Order Summary & Coupon */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6 sticky top-28">
              <h2 className="font-luxury text-lg font-bold text-slate-900 pb-3 border-b border-slate-100">
                Order Review
              </h2>

              {/* Items Preview */}
              <div className="space-y-3 max-h-56 overflow-y-auto pr-1 divide-y divide-slate-100">
                {cart.items.map((item) => (
                  <div key={item._id} className="pt-2 first:pt-0 flex justify-between text-xs">
                    <div>
                      <p className="font-semibold text-slate-900 line-clamp-1">{item.product?.name}</p>
                      <p className="text-[11px] text-slate-500">
                        Size: <span className="font-semibold text-slate-700">{item.selectedSize || 'M'}</span>
                        {item.selectedColor ? ` • ${item.selectedColor}` : ''} • Qty: {item.quantity}
                      </p>
                    </div>
                    <span className="font-bold text-slate-900">${item.itemTotal?.toFixed(2)}</span>
                  </div>
                ))}
              </div>

              {/* Coupon Form */}
              <div className="pt-4 border-t border-slate-100">
                {appliedCoupon ? (
                  <div className="flex items-center justify-between p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800">
                    <div className="flex items-center space-x-2">
                      <Tag className="w-4 h-4 text-emerald-600" />
                      <div>
                        <span className="font-mono font-bold">{appliedCoupon.code}</span>
                        <p className="text-[10px] text-emerald-600">-${appliedCoupon.discountAmount.toFixed(2)} applied</p>
                      </div>
                    </div>
                    <button
                      onClick={handleRemoveCoupon}
                      className="text-xs font-bold text-rose-600 hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleApplyCoupon} className="space-y-2">
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        placeholder="Coupon Code (e.g. LUXE2026)"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                        className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs uppercase font-mono tracking-wider focus:outline-none focus:ring-1 focus:ring-slate-900"
                      />
                      <button
                        type="submit"
                        disabled={couponLoading}
                        className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition"
                      >
                        {couponLoading ? '...' : 'Apply'}
                      </button>
                    </div>
                    {couponError && (
                      <p className="text-[11px] text-rose-600">{couponError}</p>
                    )}
                  </form>
                )}
              </div>

              {/* Cost Breakdown */}
              <div className="space-y-2.5 text-xs text-slate-600 pt-2 border-t border-slate-100">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-semibold text-slate-900">${subtotal.toFixed(2)}</span>
                </div>
                {appliedCoupon && (
                  <div className="flex justify-between text-emerald-600 font-semibold">
                    <span>Discount</span>
                    <span>-${discountAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Courier Shipping</span>
                  <span className="font-semibold text-slate-900">
                    {shippingAmount === 0 ? 'FREE' : `$${shippingAmount.toFixed(2)}`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Estimated Tax (5%)</span>
                  <span className="font-semibold text-slate-900">${taxAmount.toFixed(2)}</span>
                </div>
                <div className="pt-3 border-t border-slate-100 flex justify-between items-baseline">
                  <span className="text-sm font-bold text-slate-900">Total Due</span>
                  <span className="font-luxury text-2xl font-extrabold text-slate-900">
                    ${totalAmount.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Place Order CTA */}
              <button
                onClick={handlePlaceOrder}
                disabled={placingOrder}
                className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white text-xs uppercase tracking-widest font-bold rounded-xl transition shadow-xl flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                <span>{placingOrder ? 'Processing Order...' : 'Authorize & Place Order'}</span>
              </button>

              <p className="text-[10px] text-slate-400 text-center leading-tight">
                By placing this order, you agree to our 30-Day Privilege Policy and Terms of Sale.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Add Address Modal */}
      <Modal
        isOpen={addAddressModalOpen}
        onClose={() => setAddAddressModalOpen(false)}
        title="Add Shipping Address"
      >
        <form onSubmit={handleSaveAddress} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] uppercase font-bold text-slate-700 block mb-1">
                Full Name *
              </label>
              <input
                type="text"
                required
                value={newAddress.fullName}
                onChange={(e) => setNewAddress({ ...newAddress, fullName: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
              />
            </div>
            <div>
              <label className="text-[10px] uppercase font-bold text-slate-700 block mb-1">
                Phone Number *
              </label>
              <input
                type="text"
                required
                value={newAddress.phone}
                onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
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
              value={newAddress.streetAddress}
              onChange={(e) => setNewAddress({ ...newAddress, streetAddress: e.target.value })}
              placeholder="123 Park Avenue"
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
            />
          </div>

          <div>
            <label className="text-[10px] uppercase font-bold text-slate-700 block mb-1">
              Apartment, Suite, Unit
            </label>
            <input
              type="text"
              value={newAddress.apartment}
              onChange={(e) => setNewAddress({ ...newAddress, apartment: e.target.value })}
              placeholder="Suite 400"
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
                value={newAddress.city}
                onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
              />
            </div>
            <div>
              <label className="text-[10px] uppercase font-bold text-slate-700 block mb-1">
                State/Province *
              </label>
              <input
                type="text"
                required
                value={newAddress.state}
                onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })}
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
                value={newAddress.postalCode}
                onChange={(e) => setNewAddress({ ...newAddress, postalCode: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-slate-900 text-white rounded-xl text-xs uppercase tracking-wider font-bold hover:bg-slate-800 transition"
          >
            Save Address
          </button>
        </form>
      </Modal>
    </div>
  );
};
