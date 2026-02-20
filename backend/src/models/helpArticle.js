// backend/src/models/helpArticle.js
import mongoose from 'mongoose';

const helpArticleSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  category: {
    type: String,
    required: true,
    enum: [
      'getting-started',
      'taking-quizzes',
      'creating-quizzes',
      'wellness',
      'analytics',
      'privacy',
      'technical',
      'account',
      'faq'
    ]
  },
  content: {
    type: String,
    required: true
  },
  excerpt: {
    type: String,
    maxlength: 200
  },
  targetRoles: [{
    type: String,
    enum: ['student', 'teacher', 'admin', 'all'],
    default: 'all'
  }],
  tags: [String],
  readTime: {
    type: String,
    default: '3 min read'
  },
  icon: {
    type: String // Icon name for UI
  },
  order: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'published'
  },
  helpful: {
    type: Number,
    default: 0
  },
  views: {
    type: Number,
    default: 0
  },
  relatedArticles: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'HelpArticle'
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Create slug from title before saving
helpArticleSchema.pre('save', function(next) {
  if (this.isModified('title') && !this.slug) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
  this.lastUpdated = Date.now();
  next();
});

// Index for search
helpArticleSchema.index({ title: 'text', content: 'text', tags: 'text' });

const HelpArticle = mongoose.model('HelpArticle', helpArticleSchema);

export default HelpArticle;