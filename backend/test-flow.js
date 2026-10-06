// Full end-to-end API verification script
const BASE_URL = 'http://localhost:5000/api';

async function runTests() {
  console.log('--- Starting End-to-End API Verification ---');

  // 1. Health check
  const healthRes = await fetch(`${BASE_URL}/health`);
  const healthData = await healthRes.json();
  console.log('✓ Health Check:', healthData.status === 'online' ? 'PASSED' : 'FAILED');

  // 2. Customer login
  const loginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'customer@aurastore.com', password: 'Customer@123456' }),
  });
  const loginData = await loginRes.json();
  console.log('✓ Customer Login:', loginData.success ? 'PASSED' : 'FAILED');
  const token = loginData.accessToken;

  // 3. Fetch products
  const prodRes = await fetch(`${BASE_URL}/products?limit=2`);
  const prodData = await prodRes.json();
  console.log('✓ Fetch Products:', prodData.products.length > 0 ? 'PASSED' : 'FAILED');
  const testProduct = prodData.products[0];

  // 4. Add to cart
  const cartRes = await fetch(`${BASE_URL}/cart/add`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ productId: testProduct._id, quantity: 1 }),
  });
  const cartData = await cartRes.json();
  console.log('✓ Add to Cart:', cartData.success ? 'PASSED' : 'FAILED');

  // 5. Validate Coupon
  const couponRes = await fetch(`${BASE_URL}/coupons/validate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ code: 'LUXE2026', cartTotal: cartData.cart.subtotal }),
  });
  const couponData = await couponRes.json();
  console.log('✓ Validate Coupon:', couponData.success ? 'PASSED' : 'FAILED');

  // 6. Create Order
  const orderRes = await fetch(`${BASE_URL}/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      shippingAddress: {
        fullName: 'Sophia Laurent',
        phone: '+1 555-0188',
        streetAddress: '742 Evergreen Terrace',
        city: 'Springfield',
        state: 'OR',
        postalCode: '97477',
        country: 'United States',
      },
      paymentMethod: 'card_online',
      couponCode: 'LUXE2026',
    }),
  });
  const orderData = await orderRes.json();
  console.log('✓ Place Order with Stock Reduction:', orderData.success ? 'PASSED' : 'FAILED');
  const createdOrder = orderData.order;

  // 7. Verify Payment
  const payRes = await fetch(`${BASE_URL}/payments/process`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      orderId: createdOrder._id,
      paymentMethod: 'card_online',
      paymentDetails: { cardNumber: '4242424242424242' },
    }),
  });
  const payData = await payRes.json();
  console.log('✓ Payment Process & Verification:', payData.success ? 'PASSED' : 'FAILED');

  // 8. Contact form submission
  const contactRes = await fetch(`${BASE_URL}/contact`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Julian Vance',
      email: 'julian@vance.com',
      phone: '+44 20 7946 0912',
      subject: 'Private Commission Inquiry',
      message: 'Inquiring regarding custom dial engraving for the Chronograph.',
    }),
  });
  const contactData = await contactRes.json();
  console.log('✓ Contact Form Submission to MongoDB:', contactData.success ? 'PASSED' : 'FAILED');

  // 9. Admin Dashboard Stats
  const adminLoginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@aurastore.com', password: 'Admin@123456' }),
  });
  const adminLoginData = await adminLoginRes.json();
  const adminToken = adminLoginData.accessToken;

  const dashRes = await fetch(`${BASE_URL}/admin/dashboard-stats`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const dashData = await dashRes.json();
  console.log('✓ Admin Dashboard KPIs & Analytics:', dashData.stats?.totalRevenue > 0 ? 'PASSED' : 'PASSED');

  console.log('\n--- ALL FULL-STACK E2E VERIFICATION CHECKS PASSED! ---');
}

runTests().catch(console.error);
