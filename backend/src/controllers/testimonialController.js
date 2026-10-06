import { Testimonial } from '../models/Testimonial.js';

export const getTestimonials = async (req, res, next) => {
  try {
    const testimonials = await Testimonial.find({ isActive: true })
      .sort({ displayOrder: 1, createdAt: -1 });
    res.status(200).json({ success: true, count: testimonials.length, testimonials });
  } catch (error) {
    next(error);
  }
};

export const getAllTestimonialsAdmin = async (req, res, next) => {
  try {
    const testimonials = await Testimonial.find().sort({ displayOrder: 1, createdAt: -1 });
    res.status(200).json({ success: true, count: testimonials.length, testimonials });
  } catch (error) {
    next(error);
  }
};

export const createTestimonial = async (req, res, next) => {
  try {
    const { clientName, roleOrCompany, avatar, rating, reviewText, isFeatured, isActive, displayOrder } = req.body;

    if (!clientName || !reviewText) {
      return res.status(400).json({ success: false, message: 'Client name and testimonial text are required' });
    }

    const testimonial = await Testimonial.create({
      clientName,
      roleOrCompany: roleOrCompany || 'Verified Customer',
      avatar: avatar || '',
      rating: Number(rating) || 5,
      reviewText,
      isFeatured: isFeatured !== undefined ? isFeatured : true,
      isActive: isActive !== undefined ? isActive : true,
      displayOrder: Number(displayOrder) || 0,
    });

    res.status(201).json({ success: true, message: 'Testimonial created successfully', testimonial });
  } catch (error) {
    next(error);
  }
};

export const updateTestimonial = async (req, res, next) => {
  try {
    const testimonial = await Testimonial.findById(req.params.id);
    if (!testimonial) {
      return res.status(404).json({ success: false, message: 'Testimonial not found' });
    }

    Object.assign(testimonial, req.body);
    await testimonial.save();

    res.status(200).json({ success: true, message: 'Testimonial updated successfully', testimonial });
  } catch (error) {
    next(error);
  }
};

export const deleteTestimonial = async (req, res, next) => {
  try {
    const testimonial = await Testimonial.findByIdAndDelete(req.params.id);
    if (!testimonial) {
      return res.status(404).json({ success: false, message: 'Testimonial not found' });
    }
    res.status(200).json({ success: true, message: 'Testimonial deleted successfully' });
  } catch (error) {
    next(error);
  }
};
