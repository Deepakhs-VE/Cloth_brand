import { ContactMessage } from '../models/ContactMessage.js';

export const submitContactMessage = async (req, res, next) => {
  try {
    const { name, email, phone, subject, message } = req.body;

    if (!name || !email || !subject || !message) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, subject, and message are required',
      });
    }

    const contactMessage = await ContactMessage.create({
      name,
      email,
      phone: phone || '',
      subject,
      message,
      status: 'NEW',
    });

    res.status(201).json({
      success: true,
      message: 'Your message has been received. Our concierge will get back to you shortly.',
      contactMessage,
    });
  } catch (error) {
    next(error);
  }
};

export const getContactMessagesAdmin = async (req, res, next) => {
  try {
    const { status } = req.query;
    const query = {};
    if (status) query.status = status;

    const messages = await ContactMessage.find(query).sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: messages.length, messages });
  } catch (error) {
    next(error);
  }
};

export const updateContactMessageStatus = async (req, res, next) => {
  try {
    const { status, adminReplyNote } = req.body;
    const message = await ContactMessage.findById(req.params.id);

    if (!message) {
      return res.status(404).json({ success: false, message: 'Message not found' });
    }

    if (status) message.status = status;
    if (adminReplyNote !== undefined) message.adminReplyNote = adminReplyNote;

    await message.save();

    res.status(200).json({ success: true, message: 'Message updated', contactMessage: message });
  } catch (error) {
    next(error);
  }
};

export const deleteContactMessage = async (req, res, next) => {
  try {
    const message = await ContactMessage.findByIdAndDelete(req.params.id);
    if (!message) {
      return res.status(404).json({ success: false, message: 'Message not found' });
    }
    res.status(200).json({ success: true, message: 'Message deleted successfully' });
  } catch (error) {
    next(error);
  }
};
