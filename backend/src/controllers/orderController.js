import { Order } from '../models/Order.js';
import { Product } from '../models/Product.js';
import { Cart } from '../models/Cart.js';
import { Coupon } from '../models/Coupon.js';
import { SiteSettings } from '../models/SiteSettings.js';
import { emailService } from '../utils/emailService.js';
import { normalizePhoneNumber } from '../utils/phone.js';
import { normalizeEuropeanCountry } from '../utils/countries.js';
import { convertFromBase } from '../utils/exchangeRateService.js';
import PDFDocument from 'pdfkit';

// Helper to generate unique order number (e.g. AUR-202610-8291)
const generateOrderNumber = () => {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `AUR-${dateStr}-${randomSuffix}`;
};

const getSelectedVariant = (product, size = '', color = '') =>
  product.variants?.find(
    (variant) => variant.isActive && variant.size === size && variant.color === color
  ) || null;

const restoreOrderItemStock = async (item) => {
  const product = await Product.findById(item.product);
  if (!product) return;
  if (product.variants?.length) {
    const variant = product.variants.find((entry) =>
      item.variantSku
        ? entry.sku === item.variantSku
        : entry.size === (item.selectedSize || '') && entry.color === (item.selectedColor || '')
    );
    if (variant) variant.stock += item.quantity;
  }
  product.stock += item.quantity;
  await product.save();
};

const releaseReservedStock = async (items) => {
  await Promise.all(items.map((item) => {
    if (item.variantSku) {
      return Product.updateOne(
        { _id: item.productId },
        {
          $inc: {
            stock: item.quantity,
            'variants.$[variant].stock': item.quantity,
          },
        },
        { arrayFilters: [{ 'variant.sku': item.variantSku }] }
      );
    }
    return Product.updateOne({ _id: item.productId }, { $inc: { stock: item.quantity } });
  }));
};

export const createOrder = async (req, res, next) => {
  const reservedStock = [];
  let appliedCoupon = null;
  let couponUsageCommitted = false;
  try {
    const { shippingAddress, paymentMethod = 'stripe', couponCode } = req.body;
    let settings = await SiteSettings.findOne();
    if (!settings) settings = await SiteSettings.create({});
    const commerceSettings = settings?.commerce || {};
    const currency = String(commerceSettings.currencyCode || 'EUR').toUpperCase();
    const locale = commerceSettings.locale || 'en-IE';
    let vatRate = Number(commerceSettings.defaultVatRate ?? 20);
    const pricesIncludeVat = commerceSettings.pricesIncludeVat !== false;

    if (paymentMethod !== 'stripe') {
      return res.status(400).json({
        success: false,
        message: 'Stripe is the only supported payment method',
      });
    }

    if (!shippingAddress || !shippingAddress.streetAddress || !shippingAddress.city) {
      return res.status(400).json({ success: false, message: 'Complete shipping address is required' });
    }

    Object.assign(
      shippingAddress,
      normalizeEuropeanCountry(shippingAddress.countryCode, shippingAddress.country)
    );
    const destinationVat = (commerceSettings.countryVatRates || []).find(
      (entry) => String(entry.countryCode).toUpperCase() === shippingAddress.countryCode
    );
    if (destinationVat) vatRate = Number(destinationVat.rate);
    const supportedCountries = (commerceSettings.supportedCountries || []).map((entry) => String(entry).trim().toUpperCase());
    const blockedPostalPrefixes = (commerceSettings.blockedPostalPrefixes || []).map((entry) => String(entry).trim().toUpperCase());
    const normalizedPostalCode = String(shippingAddress.postalCode || '').trim().toUpperCase();
    if (supportedCountries.length && !supportedCountries.includes(shippingAddress.countryCode)) {
      return res.status(400).json({ success: false, message: 'Delivery is not available for the selected country' });
    }
    if (blockedPostalPrefixes.some((prefix) => prefix && normalizedPostalCode.startsWith(prefix))) {
      return res.status(400).json({ success: false, message: 'Delivery is not available for this postal code' });
    }

    shippingAddress.phone = normalizePhoneNumber(shippingAddress.phone, {
      required: true,
      fieldName: 'Shipping phone',
    });

    // 1. Fetch user's cart
    const cart = await Cart.findOne({ user: req.user._id }).populate('items.product');
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ success: false, message: 'Your shopping cart is empty' });
    }

    // 2. Validate products, stock, and fetch latest database prices
    let subtotal = 0;
    const orderItems = [];
    const stockToReduce = [];

    for (const item of cart.items) {
      const product = await Product.findById(item.product._id);

      if (!product || !product.isActive) {
        return res.status(400).json({
          success: false,
          message: `Item "${item.product.name || 'Unknown'}" is no longer available`,
        });
      }

      const selectedVariant = getSelectedVariant(
        product,
        item.selectedSize || '',
        item.selectedColor || ''
      );
      const usesVariants = product.variants?.length > 0;
      const availableStock = usesVariants ? selectedVariant?.stock || 0 : product.stock;

      if (usesVariants && !selectedVariant) {
        return res.status(400).json({
          success: false,
          message: `The selected size and colour combination for "${product.name}" is unavailable`,
        });
      }

      if (availableStock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for "${product.name}" in the selected size and colour. Only ${availableStock} unit(s) remain.`,
        });
      }

      if (product.sizes?.length > 0 && !product.sizes.includes(item.selectedSize || '')) {
        return res.status(400).json({
          success: false,
          message: `Please select an available size for "${product.name}"`,
        });
      }

      if (product.colors?.length > 0 && !product.colors.includes(item.selectedColor || '')) {
        return res.status(400).json({
          success: false,
          message: `Please select an available colour for "${product.name}"`,
        });
      }

      const variantRegularPrice = selectedVariant?.basePrice ?? selectedVariant?.price ?? product.basePrice ?? product.price;
      const currentBasePrice = selectedVariant?.baseDiscountPrice !== null && selectedVariant?.baseDiscountPrice !== undefined
        ? selectedVariant.baseDiscountPrice
        : selectedVariant?.basePrice !== null && selectedVariant?.basePrice !== undefined
        ? variantRegularPrice
        : product.baseDiscountPrice ?? product.discountPrice ?? variantRegularPrice;
      const currentPrice = await convertFromBase(currentBasePrice, settings);

      const itemTotal = currentPrice * item.quantity;
      subtotal += itemTotal;

      orderItems.push({
        product: product._id,
        name: product.name,
        slug: product.slug,
        image: selectedVariant?.images?.[0] || product.images[0] || '',
        price: currentPrice,
        quantity: item.quantity,
        selectedSize: item.selectedSize || '',
        selectedColor: item.selectedColor || '',
        variantSku: selectedVariant?.sku || '',
        total: Math.round(itemTotal * 100) / 100,
        returnPolicy: {
          returnable: product.returnPolicy?.returnable !== false,
          exchangeable: product.returnPolicy?.exchangeable !== false,
          returnWindowDays: Math.max(14, product.returnPolicy?.returnWindowDays ?? commerceSettings.defaultReturnWindowDays ?? 30),
          exchangeWindowDays: product.returnPolicy?.exchangeWindowDays ?? commerceSettings.defaultExchangeWindowDays ?? 30,
          finalSale: product.returnPolicy?.finalSale === true,
          exemptionReason: product.returnPolicy?.exemptionReason || '',
        },
      });

      stockToReduce.push({
        productId: product._id,
        productName: product.name,
        variantSku: selectedVariant?.sku || '',
        quantity: item.quantity,
      });
    }

    // 3. Coupon validation & discount calculation
    let discountAmount = 0;
    if (couponCode) {
      const coupon = await Coupon.findOne({
        code: couponCode.toUpperCase().trim(),
        isActive: true,
      });

      if (coupon) {
        const now = new Date();
        const isValidDate = now >= coupon.startDate && now <= coupon.endDate;
        const isUnderLimit = !coupon.usageLimit || coupon.usageCount < coupon.usageLimit;
        const meetsMin = !coupon.minOrderAmount || subtotal >= coupon.minOrderAmount;

        const userUsage = coupon.usedBy.find(
          (u) => u.user.toString() === req.user._id.toString()
        );
        const isUserEligible = !userUsage || userUsage.count < coupon.perUserLimit;

        if (isValidDate && isUnderLimit && meetsMin && isUserEligible) {
          if (coupon.discountType === 'percentage') {
            discountAmount = (subtotal * coupon.discountValue) / 100;
            if (coupon.maxDiscountAmount && discountAmount > coupon.maxDiscountAmount) {
              discountAmount = coupon.maxDiscountAmount;
            }
          } else {
            discountAmount = coupon.discountValue;
          }
          discountAmount = Math.min(discountAmount, subtotal);
          appliedCoupon = coupon;
        }
      }
    }

    subtotal = Math.round(subtotal * 100) / 100;
    discountAmount = Math.round(discountAmount * 100) / 100;

    const freeShippingThreshold = Number(commerceSettings.freeShippingThreshold ?? 150);
    const shippingAmount = subtotal >= freeShippingThreshold
      ? 0
      : Number(commerceSettings.standardShippingAmount ?? 15);
    const discountedMerchandise = Math.max(0, subtotal - discountAmount);
    // European storefront prices are normally VAT-inclusive. Keep the VAT
    // component for invoices without charging it a second time.
    const taxableAmount = discountedMerchandise + shippingAmount;
    const taxAmount = pricesIncludeVat
      ? Math.round((taxableAmount - taxableAmount / (1 + vatRate / 100)) * 100) / 100
      : Math.round(taxableAmount * (vatRate / 100) * 100) / 100;
    const totalAmount = Math.round((discountedMerchandise + shippingAmount + (pricesIncludeVat ? 0 : taxAmount)) * 100) / 100;

    // 4. Atomically reserve stock. The conditional update prevents two
    // simultaneous checkouts from purchasing the final unit.
    for (const item of stockToReduce) {
      const updatedProduct = item.variantSku
        ? await Product.findOneAndUpdate(
            {
              _id: item.productId,
              isActive: true,
              stock: { $gte: item.quantity },
              variants: {
                $elemMatch: {
                  sku: item.variantSku,
                  isActive: true,
                  stock: { $gte: item.quantity },
                },
              },
            },
            {
              $inc: {
                stock: -item.quantity,
                'variants.$[variant].stock': -item.quantity,
              },
            },
            { arrayFilters: [{ 'variant.sku': item.variantSku }], new: true }
          )
        : await Product.findOneAndUpdate(
            { _id: item.productId, isActive: true, stock: { $gte: item.quantity } },
            { $inc: { stock: -item.quantity } },
            { new: true }
          );

      if (!updatedProduct) {
        await releaseReservedStock(reservedStock);
        reservedStock.length = 0;
        return res.status(409).json({
          success: false,
          message: `Stock changed while checking out "${item.productName}". Please review your cart and try again.`,
        });
      }
      reservedStock.push(item);
    }

    // 5. Update coupon usage
    if (appliedCoupon) {
      appliedCoupon.usageCount += 1;
      const userIndex = appliedCoupon.usedBy.findIndex(
        (u) => u.user.toString() === req.user._id.toString()
      );
      if (userIndex > -1) {
        appliedCoupon.usedBy[userIndex].count += 1;
      } else {
        appliedCoupon.usedBy.push({ user: req.user._id, count: 1 });
      }
      await appliedCoupon.save();
      couponUsageCommitted = true;
    }

    // 6. Create Order
    const orderNumber = generateOrderNumber();
    const order = await Order.create({
      orderNumber,
      user: req.user._id,
      orderItems,
      shippingAddress,
      paymentMethod: 'stripe',
      paymentStatus: 'PENDING',
      subtotal,
      discountAmount,
      couponCode: appliedCoupon ? appliedCoupon.code : null,
      shippingAmount,
      taxAmount,
      totalAmount,
      currency,
      locale,
      vatRate,
      pricesIncludeVat,
      orderStatus: 'PENDING',
      statusHistory: [
        {
          status: 'PENDING',
          note: 'Order created; awaiting secure Stripe payment',
        },
      ],
      isPaid: false,
      paidAt: null,
    });

    res.status(201).json({
      success: true,
      message: 'Order created. Continue to Stripe to complete payment.',
      order,
    });
  } catch (error) {
    if (reservedStock.length) await releaseReservedStock(reservedStock);
    if (couponUsageCommitted && appliedCoupon) {
      appliedCoupon.usageCount = Math.max(0, appliedCoupon.usageCount - 1);
      const usage = appliedCoupon.usedBy.find(
        (entry) => entry.user.toString() === req.user._id.toString()
      );
      if (usage) usage.count = Math.max(0, usage.count - 1);
      await appliedCoupon.save().catch(() => {});
    }
    next(error);
  }
};

export const getMyOrders = async (req, res, next) => {
  try {
    const pageNum = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 6));
    const query = { user: req.user._id };
    const total = await Order.countDocuments(query);
    const pages = Math.ceil(total / limitNum) || 1;
    const safePage = Math.min(pageNum, pages);

    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .skip((safePage - 1) * limitNum)
      .limit(limitNum);

    res.status(200).json({
      success: true,
      count: orders.length,
      total,
      page: safePage,
      pages,
      orders,
    });
  } catch (error) {
    next(error);
  }
};

export const getOrderById = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id).populate('user', 'name email phone');

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Ensure customer can only view their own order unless admin
    if (order.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to view this order' });
    }

    res.status(200).json({ success: true, order });
  } catch (error) {
    next(error);
  }
};

export const downloadInvoice = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id).populate('user', 'name email');
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    if (order.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to download this invoice' });
    }
    if (!order.isPaid) {
      return res.status(409).json({ success: false, message: 'Invoice is available after payment is confirmed' });
    }

    const settings = await SiteSettings.findOne().lean();
    const currency = order.currency || settings?.commerce?.currencyCode || 'EUR';
    const locale = order.locale || settings?.commerce?.locale || 'en-IE';
    const money = (value) => new Intl.NumberFormat(locale, { style: 'currency', currency }).format(Number(value || 0));
    const doc = new PDFDocument({ margin: 48, size: 'A4' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="invoice-${order.orderNumber}.pdf"`);
    doc.pipe(res);

    doc.fontSize(22).fillColor('#0f172a').text(settings?.brandName || 'AURA Atelier');
    doc.fontSize(10).fillColor('#475569').text(settings?.legalBusiness?.legalName || settings?.brandName || 'AURA Atelier');
    if (settings?.legalBusiness?.vatNumber) doc.text(`VAT: ${settings.legalBusiness.vatNumber}`);
    if (settings?.legalBusiness?.companyRegistrationNumber) doc.text(`Company registration: ${settings.legalBusiness.companyRegistrationNumber}`);
    doc.moveDown().fontSize(18).fillColor('#0f172a').text('Tax Invoice', { align: 'right' });
    doc.fontSize(10).text(`Invoice / order: ${order.orderNumber}`, { align: 'right' });
    doc.text(`Order date: ${new Date(order.createdAt).toLocaleDateString(locale)}`, { align: 'right' });
    doc.moveDown(2).fontSize(11).text('Bill and ship to', { underline: true });
    const address = order.shippingAddress;
    doc.fontSize(10).text(address.fullName).text(address.streetAddress);
    if (address.apartment) doc.text(address.apartment);
    doc.text(`${address.postalCode} ${address.city}, ${address.state}`).text(address.country);
    doc.text(address.phone);
    doc.moveDown(1.5);

    order.orderItems.forEach((item) => {
      doc.fontSize(10).fillColor('#0f172a').text(item.name, { continued: false });
      const variant = [item.selectedColor, item.selectedSize, item.variantSku].filter(Boolean).join(' / ');
      if (variant) doc.fontSize(8).fillColor('#64748b').text(variant);
      doc.fontSize(9).fillColor('#334155').text(`${item.quantity} × ${money(item.price)}   ${money(item.total)}`, { align: 'right' });
      doc.moveDown(0.5);
    });

    doc.moveTo(48, doc.y).lineTo(547, doc.y).strokeColor('#cbd5e1').stroke();
    doc.moveDown().fontSize(10).fillColor('#334155');
    doc.text(`Subtotal: ${money(order.subtotal)}`, { align: 'right' });
    if (order.discountAmount) doc.text(`Discount: -${money(order.discountAmount)}`, { align: 'right' });
    doc.text(`Delivery: ${money(order.shippingAmount)}`, { align: 'right' });
    doc.text(`VAT (${order.vatRate || 0}%)${order.pricesIncludeVat ? ' included' : ''}: ${money(order.taxAmount)}`, { align: 'right' });
    doc.fontSize(13).fillColor('#0f172a').text(`Total: ${money(order.totalAmount)}`, { align: 'right' });
    doc.moveDown(2).fontSize(8).fillColor('#64748b').text('Payment processed securely by Stripe. This invoice was generated electronically.');
    doc.end();
  } catch (error) {
    next(error);
  }
};

export const requestExchange = async (req, res, next) => {
  try {
    const { orderItemId, toSize = '', toColor = '', reason } = req.body;
    const order = await Order.findOne({ _id: req.params.id, user: req.user._id });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    if (order.refundRequest && !['REJECTED', 'COMPLETED'].includes(order.refundRequest.status)) {
      return res.status(409).json({ success: false, message: 'Resolve the active return or refund request before requesting an exchange' });
    }
    if (order.orderStatus !== 'DELIVERED' || !order.isPaid) {
      return res.status(400).json({ success: false, message: 'Only delivered and paid items can be exchanged' });
    }
    if (!reason || String(reason).trim().length < 5) {
      return res.status(400).json({ success: false, message: 'Please provide an exchange reason' });
    }

    const item = order.orderItems.id(orderItemId);
    if (!item) return res.status(404).json({ success: false, message: 'Order item not found' });
    if (item.returnPolicy?.finalSale || item.returnPolicy?.exchangeable === false) {
      return res.status(400).json({ success: false, message: 'This item is not eligible for exchange' });
    }
    const exchangeWindowDays = item.returnPolicy?.exchangeWindowDays ?? 30;
    const deliveredAt = order.deliveredAt || order.updatedAt;
    if (Date.now() > new Date(deliveredAt).getTime() + exchangeWindowDays * 86400000) {
      return res.status(400).json({ success: false, message: `The ${exchangeWindowDays}-day exchange window has expired` });
    }
    const activeRequest = order.exchangeRequests.find(
      (request) => request.orderItemId.toString() === item._id.toString()
        && !['REJECTED', 'COMPLETED'].includes(request.status)
    );
    if (activeRequest) {
      return res.status(409).json({ success: false, message: 'An exchange is already active for this item' });
    }
    const activeItemReturn = order.itemReturnRequests?.find(
      (request) => request.orderItemId.toString() === item._id.toString()
        && !['REJECTED', 'COMPLETED'].includes(request.status)
    );
    if (activeItemReturn) {
      return res.status(409).json({ success: false, message: 'Resolve the active return or cancellation request before exchanging this item' });
    }

    const product = await Product.findById(item.product);
    const targetVariant = product?.variants?.find(
      (variant) => variant.isActive && variant.size === String(toSize).trim() && variant.color === String(toColor).trim()
    );
    if (!targetVariant || targetVariant.stock < item.quantity) {
      return res.status(400).json({ success: false, message: 'The requested replacement variant is unavailable' });
    }
    if (targetVariant.sku === item.variantSku) {
      return res.status(400).json({ success: false, message: 'Please choose a different size or colour' });
    }
    const targetPrice = targetVariant.discountPrice !== null && targetVariant.discountPrice !== undefined
      ? targetVariant.discountPrice
      : targetVariant.price !== null && targetVariant.price !== undefined
      ? targetVariant.price
      : product.discountPrice ?? product.price;
    if (Math.abs(Number(targetPrice) - Number(item.price)) > 0.009) {
      return res.status(400).json({
        success: false,
        message: 'Direct exchanges require the replacement variant to have the same price. Please request a return for differently priced variants.',
      });
    }

    order.exchangeRequests.push({
      orderItemId: item._id,
      product: item.product,
      productName: item.name,
      quantity: item.quantity,
      fromSize: item.selectedSize,
      fromColor: item.selectedColor,
      fromVariantSku: item.variantSku,
      toSize: targetVariant.size,
      toColor: targetVariant.color,
      toVariantSku: targetVariant.sku,
      reason: String(reason).trim(),
    });
    await order.save();
    res.status(201).json({ success: true, message: 'Exchange request submitted', order });
  } catch (error) {
    next(error);
  }
};

export const updateExchangeRequestAdmin = async (req, res, next) => {
  try {
    const { status, adminNote = '' } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    const request = order.exchangeRequests.id(req.params.exchangeId);
    if (!request) return res.status(404).json({ success: false, message: 'Exchange request not found' });

    const allowed = {
      REQUESTED: ['APPROVED', 'REJECTED'],
      APPROVED: ['RECEIVED'],
      RECEIVED: ['SHIPPED'],
      SHIPPED: ['COMPLETED'],
    };
    if (!allowed[request.status]?.includes(status)) {
      return res.status(409).json({ success: false, message: `Exchange cannot move from ${request.status} to ${status}` });
    }

    if (status === 'APPROVED') {
      const reserved = await Product.findOneAndUpdate(
        {
          _id: request.product,
          stock: { $gte: request.quantity },
          variants: { $elemMatch: { sku: request.toVariantSku, isActive: true, stock: { $gte: request.quantity } } },
        },
        {
          $inc: {
            stock: -request.quantity,
            'variants.$[variant].stock': -request.quantity,
          },
        },
        { arrayFilters: [{ 'variant.sku': request.toVariantSku }], new: true }
      );
      if (!reserved) {
        return res.status(409).json({ success: false, message: 'The requested replacement is no longer in stock' });
      }
      request.reviewedAt = new Date();
    }

    if (status === 'RECEIVED') {
      await restoreOrderItemStock({
        product: request.product,
        variantSku: request.fromVariantSku,
        selectedSize: request.fromSize,
        selectedColor: request.fromColor,
        quantity: request.quantity,
      });
      request.receivedAt = new Date();
    }
    if (status === 'SHIPPED') request.shippedAt = new Date();
    if (status === 'COMPLETED') request.completedAt = new Date();
    request.status = status;
    request.adminNote = String(adminNote).trim();
    await order.save();
    res.status(200).json({ success: true, message: `Exchange updated to ${status}`, order });
  } catch (error) {
    next(error);
  }
};

export const cancelOrder = async (req, res, next) => {
  try {
    const { reason } = req.body;
    const order = await Order.findOne({ _id: req.params.id, user: req.user._id });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (order.exchangeRequests?.some((request) => !['REJECTED', 'COMPLETED'].includes(request.status))) {
      return res.status(409).json({
        success: false,
        message: 'Resolve the active exchange request before requesting a return or refund',
      });
    }
    if (order.itemReturnRequests?.some((request) => !['REJECTED', 'COMPLETED'].includes(request.status))) {
      return res.status(409).json({
        success: false,
        message: 'Resolve active item-level requests before cancelling the complete order',
      });
    }

    if (order.orderStatus === 'CANCELLED') {
      return res.status(200).json({
        success: true,
        message: 'Order is already cancelled',
        order,
      });
    }

    if (order.isPaid) {
      return res.status(400).json({
        success: false,
        message: 'Paid Stripe orders must be refunded by an administrator before cancellation',
      });
    }

    // Cancellation business rule: Customer can only cancel if status is PENDING or CONFIRMED
    const cancellableStatuses = ['PENDING', 'CONFIRMED'];
    if (!cancellableStatuses.includes(order.orderStatus)) {
      return res.status(400).json({
        success: false,
        message: `Order cannot be cancelled because it is already ${order.orderStatus.toLowerCase()}`,
      });
    }

    order.orderStatus = 'CANCELLED';
    order.cancelledAt = new Date();
    order.cancellationReason = reason || 'Customer requested cancellation';
    order.statusHistory.push({
      status: 'CANCELLED',
      note: `Cancelled by customer: ${reason || 'Customer request'}`,
    });

    await order.save();

    // Restore inventory stock
    for (const item of order.orderItems) {
      await restoreOrderItemStock(item);
    }

    if (order.couponCode) {
      const coupon = await Coupon.findOne({ code: order.couponCode });
      if (coupon) {
        coupon.usageCount = Math.max(0, coupon.usageCount - 1);
        const userUsage = coupon.usedBy.find(
          (entry) => entry.user.toString() === req.user._id.toString()
        );
        if (userUsage) {
          userUsage.count = Math.max(0, userUsage.count - 1);
        }
        await coupon.save();
      }
    }

    res.status(200).json({
      success: true,
      message: 'Order cancelled successfully and stock restored',
      order,
    });
  } catch (error) {
    next(error);
  }
};

export const requestRefund = async (req, res, next) => {
  try {
    const reason = String(req.body.reason || '').trim();
    const order = await Order.findOne({ _id: req.params.id, user: req.user._id });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (order.itemReturnRequests?.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'This order is already using item-level processing. Submit separate requests for the remaining eligible items.',
      });
    }

    if (order.exchangeRequests?.some((request) => !['REJECTED', 'COMPLETED'].includes(request.status))) {
      return res.status(409).json({
        success: false,
        message: 'Resolve the active exchange request before requesting a return or refund',
      });
    }

    if (reason.length < 10) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a clear reason of at least 10 characters',
      });
    }

    if (!order.isPaid || order.paymentStatus !== 'PAID') {
      return res.status(400).json({
        success: false,
        message: 'This order has no completed Stripe payment to refund',
      });
    }

    if (['CANCELLED', 'REFUNDED'].includes(order.orderStatus)) {
      return res.status(400).json({
        success: false,
        message: `This order is already ${order.orderStatus.toLowerCase()}`,
      });
    }

    const activeRequestStatuses = [
      'REQUESTED',
      'APPROVED',
      'RECEIVED',
      'REFUND_PENDING',
      'COMPLETED',
    ];
    if (order.refundRequest && activeRequestStatuses.includes(order.refundRequest.status)) {
      return res.status(409).json({
        success: false,
        message: `A refund request is already ${order.refundRequest.status.toLowerCase().replace(/_/g, ' ')}`,
      });
    }

    const preShipmentStatuses = ['PENDING', 'CONFIRMED', 'PROCESSING'];
    let requestType;

    if (preShipmentStatuses.includes(order.orderStatus)) {
      requestType = 'CANCELLATION';
    } else if (order.orderStatus === 'DELIVERED') {
      const ineligibleItem = order.orderItems.find(
        (item) => item.returnPolicy?.finalSale || item.returnPolicy?.returnable === false
          || item.cancelledQuantity > 0 || item.returnedQuantity > 0
      );
      if (ineligibleItem) {
        return res.status(400).json({
          success: false,
          message: 'This order contains an item that is not eligible for a full-order return. Use the item-level return option for eligible items.',
        });
      }
      const deliveredAt = order.deliveredAt || order.updatedAt;
      const returnWindowDays = Math.min(...order.orderItems.map((item) => item.returnPolicy?.returnWindowDays ?? 30));
      const returnWindowEndsAt = new Date(deliveredAt).getTime() + returnWindowDays * 24 * 60 * 60 * 1000;
      if (Date.now() > returnWindowEndsAt) {
        return res.status(400).json({
          success: false,
          message: `The ${returnWindowDays}-day return window for this order has expired`,
        });
      }
      requestType = 'RETURN';
    } else {
      return res.status(400).json({
        success: false,
        message: 'Orders in transit cannot be cancelled. Request a return after delivery or contact support.',
      });
    }

    order.refundRequest = {
      type: requestType,
      status: 'REQUESTED',
      reason,
      requestedAt: new Date(),
    };
    order.statusHistory.push({
      status: order.orderStatus,
      note: `${requestType === 'RETURN' ? 'Return' : 'Cancellation'} and refund requested by customer`,
    });
    await order.save();

    res.status(201).json({
      success: true,
      message: requestType === 'RETURN'
        ? 'Return request submitted for administrator review'
        : 'Cancellation and refund request submitted for administrator review',
      order,
    });
  } catch (error) {
    next(error);
  }
};

export const reviewRefundRequestAdmin = async (req, res, next) => {
  try {
    const action = String(req.body.action || '').toUpperCase();
    const adminNote = String(req.body.adminNote || '').trim();
    const order = await Order.findById(req.params.id).populate('user', 'name email');

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    if (!order.refundRequest) {
      return res.status(404).json({ success: false, message: 'No refund request exists for this order' });
    }

    if (action === 'APPROVE' || action === 'REJECT') {
      if (order.refundRequest.status !== 'REQUESTED') {
        return res.status(409).json({
          success: false,
          message: 'Only a pending refund request can be approved or rejected',
        });
      }
      if (action === 'REJECT' && adminNote.length < 5) {
        return res.status(400).json({
          success: false,
          message: 'Please provide a reason for rejecting this request',
        });
      }

      order.refundRequest.status = action === 'APPROVE' ? 'APPROVED' : 'REJECTED';
      order.refundRequest.adminNote = adminNote;
      order.refundRequest.reviewedAt = new Date();
    } else if (action === 'MARK_RECEIVED') {
      if (order.refundRequest.type !== 'RETURN' || order.refundRequest.status !== 'APPROVED') {
        return res.status(409).json({
          success: false,
          message: 'Only an approved delivered-order return can be marked as received',
        });
      }
      order.refundRequest.status = 'RECEIVED';
      order.refundRequest.adminNote = adminNote || order.refundRequest.adminNote;
      order.refundRequest.receivedAt = new Date();
    } else {
      return res.status(400).json({
        success: false,
        message: 'Action must be APPROVE, REJECT, or MARK_RECEIVED',
      });
    }

    order.statusHistory.push({
      status: order.orderStatus,
      note: `Refund request ${order.refundRequest.status.toLowerCase().replace(/_/g, ' ')}${adminNote ? `: ${adminNote}` : ''}`,
    });
    await order.save();

    emailService.sendRefundUpdateEmail(order, order.user).catch((error) =>
      console.error('Refund request email error:', error)
    );

    res.status(200).json({
      success: true,
      message: `Refund request ${order.refundRequest.status.toLowerCase().replace(/_/g, ' ')}`,
      order,
    });
  } catch (error) {
    next(error);
  }
};

export const requestItemReturn = async (req, res, next) => {
  try {
    const { orderItemId, quantity = 1, reason } = req.body;
    const requestedQuantity = Math.max(1, Number(quantity) || 1);
    const cleanReason = String(reason || '').trim();
    const order = await Order.findOne({ _id: req.params.id, user: req.user._id });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    if (!order.isPaid || order.paymentStatus !== 'PAID') {
      return res.status(400).json({ success: false, message: 'Only paid items can be cancelled or returned through this request' });
    }
    if (cleanReason.length < 10) {
      return res.status(400).json({ success: false, message: 'Please provide a clear reason of at least 10 characters' });
    }

    const item = order.orderItems.id(orderItemId);
    if (!item) return res.status(404).json({ success: false, message: 'Order item not found' });
    const activeExchange = order.exchangeRequests?.find(
      (request) => request.orderItemId.toString() === item._id.toString()
        && !['REJECTED', 'COMPLETED'].includes(request.status)
    );
    if (activeExchange) {
      return res.status(409).json({ success: false, message: 'Resolve the active exchange before returning or cancelling this item' });
    }
    const pendingQuantity = order.itemReturnRequests
      .filter((request) => request.orderItemId.toString() === item._id.toString() && !['REJECTED', 'COMPLETED'].includes(request.status))
      .reduce((sum, request) => sum + request.quantity, 0);
    const availableQuantity = item.quantity - item.cancelledQuantity - item.returnedQuantity - pendingQuantity;
    if (requestedQuantity > availableQuantity) {
      return res.status(400).json({ success: false, message: `Only ${availableQuantity} item(s) are eligible for this request` });
    }

    const preShipment = ['PENDING', 'CONFIRMED', 'PROCESSING'].includes(order.orderStatus);
    const delivered = order.orderStatus === 'DELIVERED';
    if (!preShipment && !delivered) {
      return res.status(400).json({ success: false, message: 'Items in transit cannot be cancelled. Request a return after delivery.' });
    }
    if (delivered) {
      if (item.returnPolicy?.finalSale || item.returnPolicy?.returnable === false) {
        return res.status(400).json({ success: false, message: 'This item is not eligible for return' });
      }
      const windowDays = item.returnPolicy?.returnWindowDays ?? 30;
      const deliveredAt = order.deliveredAt || order.updatedAt;
      if (Date.now() > new Date(deliveredAt).getTime() + windowDays * 86400000) {
        return res.status(400).json({ success: false, message: `The ${windowDays}-day return window has expired` });
      }
    }

    const grossItemAmount = item.price * requestedQuantity;
    const discountShare = order.subtotal > 0 ? (grossItemAmount / order.subtotal) * order.discountAmount : 0;
    const refundAmount = Math.round(Math.max(0, grossItemAmount - discountShare) * 100) / 100;
    order.itemReturnRequests.push({
      orderItemId: item._id,
      product: item.product,
      productName: item.name,
      variantSku: item.variantSku,
      quantity: requestedQuantity,
      type: delivered ? 'RETURN' : 'CANCELLATION',
      reason: cleanReason,
      refundAmount,
    });
    await order.save();
    const createdRequest = order.itemReturnRequests[order.itemReturnRequests.length - 1];
    emailService.sendItemReturnUpdateEmail(order, createdRequest, req.user).catch((error) =>
      console.error('Item return request email error:', error)
    );
    res.status(201).json({ success: true, message: delivered ? 'Item return requested' : 'Item cancellation requested', order });
  } catch (error) {
    next(error);
  }
};

export const updateItemReturnAdmin = async (req, res, next) => {
  try {
    const action = String(req.body.action || '').toUpperCase();
    const adminNote = String(req.body.adminNote || '').trim();
    const order = await Order.findById(req.params.id).populate('user', 'name email');
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    const request = order.itemReturnRequests.id(req.params.requestId);
    if (!request) return res.status(404).json({ success: false, message: 'Item request not found' });
    const item = order.orderItems.id(request.orderItemId);
    if (!item) return res.status(404).json({ success: false, message: 'Order item not found' });

    if (['APPROVE', 'REJECT'].includes(action)) {
      if (request.status !== 'REQUESTED') {
        return res.status(409).json({ success: false, message: 'Only a pending item request can be reviewed' });
      }
      if (action === 'REJECT' && adminNote.length < 5) {
        return res.status(400).json({ success: false, message: 'Provide a reason for rejecting this request' });
      }
      request.status = action === 'APPROVE' ? 'APPROVED' : 'REJECTED';
      request.reviewedAt = new Date();
      if (action === 'APPROVE' && request.type === 'CANCELLATION') {
        await restoreOrderItemStock({ ...item.toObject(), quantity: request.quantity });
        item.cancelledQuantity += request.quantity;
      }
    } else if (action === 'MARK_RECEIVED') {
      if (request.type !== 'RETURN' || request.status !== 'APPROVED') {
        return res.status(409).json({ success: false, message: 'Only an approved return can be marked received' });
      }
      await restoreOrderItemStock({ ...item.toObject(), quantity: request.quantity });
      item.returnedQuantity += request.quantity;
      request.status = 'RECEIVED';
      request.receivedAt = new Date();
    } else {
      return res.status(400).json({ success: false, message: 'Action must be APPROVE, REJECT, or MARK_RECEIVED' });
    }
    request.adminNote = adminNote || request.adminNote;
    await order.save();
    emailService.sendItemReturnUpdateEmail(order, request, order.user).catch((error) =>
      console.error('Item return update email error:', error)
    );
    res.status(200).json({ success: true, message: 'Item request updated', order });
  } catch (error) {
    next(error);
  }
};

// Admin Endpoints
export const getAllOrdersAdmin = async (req, res, next) => {
  try {
    const { status, search, page = 1, limit = 20 } = req.query;
    const query = {};

    if (status) query.orderStatus = status;
    if (search) {
      query.$or = [
        { orderNumber: { $regex: search, $options: 'i' } },
        { 'shippingAddress.fullName': { $regex: search, $options: 'i' } },
      ];
    }

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, parseInt(limit, 10));
    const skip = (pageNum - 1) * limitNum;

    const total = await Order.countDocuments(query);
    const orders = await Order.find(query)
      .populate('user', 'name email phone')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    res.status(200).json({
      success: true,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum) || 1,
      orders,
    });
  } catch (error) {
    next(error);
  }
};

export const updateOrderStatusAdmin = async (req, res, next) => {
  try {
    const { status, note, carrier, trackingNumber } = req.body;
    const order = await Order.findById(req.params.id).populate('user', 'name email');

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const validStatuses = [
      'PENDING',
      'CONFIRMED',
      'PROCESSING',
      'SHIPPED',
      'OUT_FOR_DELIVERY',
      'DELIVERED',
      'CANCELLED',
      'REFUNDED',
    ];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid order status' });
    }

    if (status === 'REFUNDED') {
      return res.status(400).json({
        success: false,
        message: 'Use the Stripe refund endpoint so the customer is actually refunded before the order is updated',
      });
    }

    if (status === 'CANCELLED' && order.isPaid) {
      return res.status(400).json({
        success: false,
        message: 'Paid Stripe orders must be refunded, not manually cancelled',
      });
    }

    const allowedTransitions = {
      PENDING: ['CONFIRMED', 'CANCELLED'],
      CONFIRMED: ['PROCESSING', 'CANCELLED'],
      PROCESSING: ['SHIPPED', 'CANCELLED'],
      SHIPPED: ['OUT_FOR_DELIVERY'],
      OUT_FOR_DELIVERY: ['DELIVERED'],
      DELIVERED: [],
      CANCELLED: [],
      REFUNDED: [],
    };

    if (
      status !== order.orderStatus &&
      !allowedTransitions[order.orderStatus]?.includes(status)
    ) {
      return res.status(400).json({
        success: false,
        message: `Order cannot move from ${order.orderStatus} to ${status}`,
      });
    }

    if (
      ['REQUESTED', 'APPROVED'].includes(order.refundRequest?.status) &&
      order.refundRequest?.type === 'CANCELLATION' &&
      status !== order.orderStatus
    ) {
      return res.status(409).json({
        success: false,
        message: 'Resolve the active cancellation/refund request before continuing fulfillment',
      });
    }

    const previousStatus = order.orderStatus;
    order.orderStatus = status;

    if (carrier) order.carrier = carrier;
    if (trackingNumber) order.trackingNumber = trackingNumber;

    if (status === 'DELIVERED') {
      order.isDelivered = true;
      order.deliveredAt = new Date();
      if (!order.isPaid) {
        order.isPaid = true;
        order.paidAt = new Date();
      }
    }

    if (status === 'CANCELLED' && previousStatus !== 'CANCELLED') {
      order.cancelledAt = new Date();
      order.cancellationReason = note || 'Cancelled by administrator';
      // Restore stock
      for (const item of order.orderItems) {
        await restoreOrderItemStock(item);
      }

      if (order.couponCode) {
        const coupon = await Coupon.findOne({ code: order.couponCode });
        if (coupon) {
          coupon.usageCount = Math.max(0, coupon.usageCount - 1);
          const userUsage = coupon.usedBy.find(
            (entry) => entry.user.toString() === order.user._id.toString()
          );
          if (userUsage) userUsage.count = Math.max(0, userUsage.count - 1);
          await coupon.save();
        }
      }
    }

    order.statusHistory.push({
      status,
      note: note || `Status updated to ${status}`,
      updatedAt: new Date(),
    });

    await order.save();

    // Trigger email notifications according to status
    if (status === 'SHIPPED') {
      emailService.sendShippingNotification(order, order.user).catch((err) =>
        console.error('Shipping email error:', err)
      );
    } else if (status === 'DELIVERED') {
      emailService.sendDeliveryNotification(order, order.user).catch((err) =>
        console.error('Delivery email error:', err)
      );
    }

    res.status(200).json({
      success: true,
      message: `Order status updated to ${status}`,
      order,
    });
  } catch (error) {
    next(error);
  }
};
