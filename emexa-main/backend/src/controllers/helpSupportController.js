import HelpArticle from "../models/helpArticle.js";
import SupportTicket from "../models/supportTicket.js";
import nodemailer from "nodemailer";

// Email transporter configuration
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

/**
 * Get all help articles (optionally filtered by category and role)
 */
export const getHelpArticles = async (req, res) => {
  try {
    const { category, role, search } = req.query;
    
    let query = { status: 'published' };
    
    if (category) {
      query.category = category;
    }
    
    if (role) {
      query.targetRoles = { $in: [role, 'all'] };
    }
    
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
        { tags: { $regex: search, $options: 'i' } }
      ];
    }

    const articles = await HelpArticle.find(query)
      .sort({ order: 1, createdAt: -1 })
      .select('-__v');

    res.status(200).json({
      success: true,
      count: articles.length,
      data: articles
    });

  } catch (error) {
    console.error('Error fetching help articles:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch help articles',
      error: error.message
    });
  }
};

/**
 * Get a single help article by ID or slug
 */
export const getHelpArticle = async (req, res) => {
  try {
    const { id } = req.params;
    
    const article = await HelpArticle.findOne({
      $or: [
        { _id: id },
        { slug: id }
      ],
      status: 'published'
    });

    if (!article) {
      return res.status(404).json({
        success: false,
        message: 'Help article not found'
      });
    }

    // Increment view count
    article.views = (article.views || 0) + 1;
    await article.save();

    res.status(200).json({
      success: true,
      data: article
    });

  } catch (error) {
    console.error('Error fetching help article:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch help article',
      error: error.message
    });
  }
};

/**
 * Get help articles by category
 */
export const getArticlesByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const userRole = req.user?.role || 'student';

    const articles = await HelpArticle.find({
      category,
      status: 'published',
      targetRoles: { $in: [userRole, 'all'] }
    })
    .sort({ order: 1, createdAt: -1 })
    .select('title slug excerpt readTime icon -_id');

    res.status(200).json({
      success: true,
      category,
      count: articles.length,
      data: articles
    });

  } catch (error) {
    console.error('Error fetching articles by category:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch articles',
      error: error.message
    });
  }
};

/**
 * Get FAQs (optionally filtered)
 */
export const getFAQs = async (req, res) => {
  try {
    const { category, role } = req.query;
    
    let query = { 
      category: 'faq',
      status: 'published' 
    };
    
    if (role) {
      query.targetRoles = { $in: [role, 'all'] };
    }

    const faqs = await HelpArticle.find(query)
      .sort({ order: 1, helpful: -1 })
      .select('title content category tags helpful views -_id');

    res.status(200).json({
      success: true,
      count: faqs.length,
      data: faqs
    });

  } catch (error) {
    console.error('Error fetching FAQs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch FAQs',
      error: error.message
    });
  }
};

/**
 * Mark article as helpful
 */
export const markArticleHelpful = async (req, res) => {
  try {
    const { id } = req.params;
    const { helpful } = req.body; // true or false

    const article = await HelpArticle.findById(id);
    
    if (!article) {
      return res.status(404).json({
        success: false,
        message: 'Article not found'
      });
    }

    if (helpful) {
      article.helpful = (article.helpful || 0) + 1;
    }

    await article.save();

    res.status(200).json({
      success: true,
      message: 'Feedback recorded',
      data: {
        helpful: article.helpful
      }
    });

  } catch (error) {
    console.error('Error marking article helpful:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to record feedback',
      error: error.message
    });
  }
};

/**
 * Submit support ticket/contact form
 */
export const submitSupportTicket = async (req, res) => {
  try {
    const { subject, category, message, priority } = req.body;
    const userId = req.user._id || req.userId;
    const userEmail = req.user.email;
    const userName = req.user.name || req.user.username;

    if (!subject || !message) {
      return res.status(400).json({
        success: false,
        message: 'Subject and message are required'
      });
    }

    // Create support ticket
    const ticket = new SupportTicket({
      userId,
      userEmail,
      userName,
      subject,
      category: category || 'general',
      message,
      priority: priority || 'normal',
      status: 'open',
      createdAt: new Date()
    });

    await ticket.save();

    // Send email notification to support team
    try {
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: process.env.SUPPORT_EMAIL || 'support@emotionquiz.edu',
        subject: `New Support Ticket: ${subject}`,
        html: `
          <h2>New Support Ticket Received</h2>
          <p><strong>From:</strong> ${userName} (${userEmail})</p>
          <p><strong>Category:</strong> ${category}</p>
          <p><strong>Priority:</strong> ${priority}</p>
          <p><strong>Subject:</strong> ${subject}</p>
          <p><strong>Message:</strong></p>
          <p>${message}</p>
          <p><strong>Ticket ID:</strong> ${ticket._id}</p>
          <p><strong>Created:</strong> ${new Date().toLocaleString()}</p>
        `
      });
    } catch (emailError) {
      console.error('Failed to send email notification:', emailError);
      // Continue even if email fails
    }

    // Send confirmation email to user
    try {
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: userEmail,
        subject: `Support Ticket Received: ${subject}`,
        html: `
          <h2>Thank you for contacting support</h2>
          <p>Hi ${userName},</p>
          <p>We've received your support request and will respond within 24 hours.</p>
          <p><strong>Ticket ID:</strong> ${ticket._id}</p>
          <p><strong>Subject:</strong> ${subject}</p>
          <p><strong>Category:</strong> ${category}</p>
          <p>You can track your ticket status in the Help & Support Centre.</p>
          <br>
          <p>Best regards,<br>Emotion-Aware Quiz System Support Team</p>
        `
      });
    } catch (emailError) {
      console.error('Failed to send confirmation email:', emailError);
    }

    res.status(201).json({
      success: true,
      message: 'Support ticket submitted successfully. We\'ll respond within 24 hours.',
      data: {
        ticketId: ticket._id,
        subject: ticket.subject,
        status: ticket.status
      }
    });

  } catch (error) {
    console.error('Error submitting support ticket:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit support ticket',
      error: error.message
    });
  }
};

/**
 * Get user's support tickets
 */
export const getUserTickets = async (req, res) => {
  try {
    const userId = req.user._id || req.userId;
    const { status } = req.query;

    let query = { userId };
    
    if (status) {
      query.status = status;
    }

    const tickets = await SupportTicket.find(query)
      .sort({ createdAt: -1 })
      .select('-__v');

    res.status(200).json({
      success: true,
      count: tickets.length,
      data: tickets
    });

  } catch (error) {
    console.error('Error fetching user tickets:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch tickets',
      error: error.message
    });
  }
};

/**
 * Get system status (for status page)
 */
export const getSystemStatus = async (req, res) => {
  try {
    // In production, this would check actual system health
    const status = {
      platform: {
        status: 'operational',
        uptime: '99.9%',
        lastChecked: new Date()
      },
      emotionAI: {
        status: 'operational',
        latency: '120ms',
        lastChecked: new Date()
      },
      database: {
        status: 'operational',
        responseTime: '15ms',
        lastChecked: new Date()
      },
      api: {
        status: 'operational',
        requestsPerMin: 1250,
        lastChecked: new Date()
      }
    };

    res.status(200).json({
      success: true,
      data: status
    });

  } catch (error) {
    console.error('Error fetching system status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch system status',
      error: error.message
    });
  }
};

/**
 * Search help content
 */
export const searchHelp = async (req, res) => {
  try {
    const { q, category, role } = req.query;

    if (!q || q.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Search query must be at least 2 characters'
      });
    }

    let query = {
      status: 'published',
      $or: [
        { title: { $regex: q, $options: 'i' } },
        { content: { $regex: q, $options: 'i' } },
        { tags: { $regex: q, $options: 'i' } },
        { excerpt: { $regex: q, $options: 'i' } }
      ]
    };

    if (category) {
      query.category = category;
    }

    if (role) {
      query.targetRoles = { $in: [role, 'all'] };
    }

    const results = await HelpArticle.find(query)
      .sort({ helpful: -1, views: -1 })
      .limit(20)
      .select('title slug excerpt category readTime icon -_id');

    res.status(200).json({
      success: true,
      query: q,
      count: results.length,
      data: results
    });

  } catch (error) {
    console.error('Error searching help content:', error);
    res.status(500).json({
      success: false,
      message: 'Search failed',
      error: error.message
    });
  }
};