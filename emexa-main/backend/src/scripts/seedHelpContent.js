// backend/src/scripts/seedHelpContent.js
import mongoose from 'mongoose';
import HelpArticle from '../models/helpArticle.js';
import dotenv from 'dotenv';

dotenv.config();

const helpArticles = [
  // Getting Started
  {
    title: "Creating Your Account",
    slug: "creating-your-account",
    category: "getting-started",
    content: `
# Creating Your Account

Register using your institutional email to get started with the Emotion-Aware Quiz System.

## Steps to Create Account

1. Navigate to the registration page
2. Enter your institutional email address
3. Set a strong password (minimum 8 characters)
4. Verify your email through the confirmation link sent to your inbox
5. Complete your profile setup with your name and preferences

## Tips

- Use a password that combines letters, numbers, and special characters
- Keep your login credentials secure
- Enable two-factor authentication in Settings for added security

## Troubleshooting

If you don't receive the verification email:
- Check your spam/junk folder
- Ensure you entered the correct email address
- Request a new verification email from the login page
- Contact support if issues persist
    `,
    excerpt: "Learn how to create and set up your account on the Emotion-Aware Quiz System.",
    targetRoles: ['student', 'teacher', 'all'],
    tags: ['account', 'registration', 'getting-started', 'setup'],
    readTime: "2 min read",
    icon: "UserPlus",
    order: 1,
    status: "published"
  },

  {
    title: "Understanding Emotion Detection",
    slug: "understanding-emotion-detection",
    category: "getting-started",
    content: `
# Understanding Emotion Detection

Our system uses AI-powered facial emotion analysis to provide personalized support during assessments.

## How It Works

The emotion detection system:
- Uses your webcam to analyze facial expressions in real-time
- Detects emotions like stress, anxiety, confusion, and calmness
- Provides adaptive support based on your emotional state
- Generates post-quiz insights about your emotional journey

## Privacy First

- Emotion detection is completely optional
- No video or audio is recorded
- Data is encrypted and secure
- You can disable it anytime in Settings
- Only you and authorized teachers see your emotional data

## Benefits

- Reduced test anxiety through adaptive support
- Personalized feedback combining performance and emotions
- Better understanding of how emotions affect learning
- Timely interventions when stress is detected

## Requirements

For best results:
- Good lighting on your face
- Face the camera directly
- Minimize background distractions
- Use a quality webcam (720p or higher)
    `,
    excerpt: "Understand how emotion detection works and how it benefits your learning experience.",
    targetRoles: ['student', 'all'],
    tags: ['emotion-detection', 'AI', 'privacy', 'webcam'],
    readTime: "4 min read",
    icon: "Brain",
    order: 3,
    status: "published"
  },

  // Taking Quizzes
  {
    title: "Taking Quizzes - Student Guide",
    slug: "taking-quizzes-student-guide",
    category: "taking-quizzes",
    content: `
# Taking Quizzes - Complete Guide

Everything you need to know about taking quizzes on our platform.

## Before You Start

### System Requirements
- Stable internet connection (5+ Mbps recommended)
- Working webcam for emotion detection
- Modern browser (Chrome, Firefox, or Edge)
- Quiet environment free from distractions

### Preparation Checklist
✓ Test your internet connection
✓ Grant camera permissions when prompted
✓ Close unnecessary tabs and applications
✓ Have any allowed materials ready
✓ Note the quiz duration and deadline

## During the Quiz

### Adaptive Features
- **Stress Detection**: System monitors your stress levels
- **Motivational Messages**: Receive encouragement when needed
- **Breathing Prompts**: Guided relaxation exercises
- **Adaptive Hints**: AI-powered help (if enabled by teacher)
- **Auto-Save**: Your answers are saved automatically

### Navigation
- Use "Previous" and "Next" buttons to move between questions
- Questions may be locked after answering (teacher's choice)
- Timer shows remaining time at the top
- Progress indicator shows completion status

### Technical Issues
If you experience problems:
1. Don't panic - progress is auto-saved
2. Take a screenshot if possible
3. Note the time and issue details
4. Contact your teacher immediately
5. Request time adjustment if needed

## After Submission

You'll receive:
- Immediate score (for auto-graded questions)
- AI-powered personalized feedback
- Emotional journey visualization
- Areas for improvement
- Correct answers (if enabled)

## Tips for Success

- Read questions carefully before answering
- Manage your time wisely
- Stay calm - stress affects performance
- Use hints strategically
- Review answers before submission
    `,
    excerpt: "Complete guide to taking quizzes, from preparation to submission.",
    targetRoles: ['student', 'all'],
    tags: ['quiz', 'student', 'taking-quiz', 'guide'],
    readTime: "5 min read",
    icon: "FileText",
    order: 1,
    status: "published"
  },

  // Creating Quizzes (Teachers)
  {
    title: "Creating Quizzes with AI",
    slug: "creating-quizzes-with-ai",
    category: "creating-quizzes",
    content: `
# Creating Quizzes with AI

Leverage AI to automatically generate quizzes from your content.

## Upload Content

Supported formats:
- PDF documents
- Word documents (.docx)
- Plain text files
- Copy-paste text directly

## AI Generation Process

1. Upload or paste your content
2. AI analyzes the material
3. Questions are generated automatically
4. Review and edit generated questions
5. Adjust difficulty levels
6. Set quiz parameters
7. Publish to students

## Customization Options

After AI generates questions, you can:
- Edit question text and answers
- Add or remove options
- Change point values
- Set time limits per question
- Enable/disable hints
- Configure emotion tracking

## Question Types

AI can generate:
- Multiple choice questions
- True/false questions
- Short answer questions
- Fill-in-the-blank

## Best Practices

- Provide clear, focused content
- Review all AI-generated questions
- Adjust difficulty based on class level
- Test quiz before publishing
- Include a mix of question types
- Set reasonable time limits

## Quality Control

Always review AI-generated content for:
- Accuracy of questions and answers
- Appropriate difficulty level
- Clear wording
- Relevance to learning objectives
- Balance of topics covered
    `,
    excerpt: "Learn how to use AI to generate quizzes automatically from your content.",
    targetRoles: ['teacher', 'all'],
    tags: ['AI', 'quiz-creation', 'teacher', 'automation'],
    readTime: "4 min read",
    icon: "Sparkles",
    order: 2,
    status: "published"
  },

  // Wellness
  {
    title: "Using the Wellness Dashboard",
    slug: "using-wellness-dashboard",
    category: "wellness",
    content: `
# Wellness Dashboard Guide

Track your emotional wellbeing alongside academic performance.

## Features

### Mood Tracking
- Log your daily mood
- View weekly emotional patterns
- Get AI-generated insights
- Correlate with academic performance

### AI Wellness Coach
- 24/7 chat support
- Personalized advice
- Stress management techniques
- Study-life balance tips

### Wellness Goals
- Set personal wellness objectives
- Track daily progress
- Get AI-suggested goals
- View completion statistics

## Privacy Controls

Your wellness data is private:
- Only you can see your mood logs
- Teachers see aggregate data only
- Disable tracking anytime
- Request data deletion
- Export your data

## Benefits

- Better self-awareness
- Identify stress triggers
- Improve emotional regulation
- Balance academics and wellbeing
- Proactive mental health support

## Getting Started

1. Visit the Wellness Centre from sidebar
2. Log your current mood
3. Explore AI tips and resources
4. Set your first wellness goal
5. Check in daily for best results

## When to Seek Help

The wellness features are supportive tools, but not a replacement for professional help. Contact counseling services if experiencing:
- Persistent sadness or anxiety
- Thoughts of self-harm
- Severe stress or panic
- Academic burnout
- Personal crises
    `,
    excerpt: "Complete guide to using wellness features for better emotional health.",
    targetRoles: ['student', 'all'],
    tags: ['wellness', 'mental-health', 'mood-tracking', 'wellbeing'],
    readTime: "4 min read",
    icon: "Heart",
    order: 1,
    status: "published"
  },

  // Privacy & Security
  {
    title: "Your Data Privacy Rights",
    slug: "your-data-privacy-rights",
    category: "privacy",
    content: `
# Your Data Privacy Rights

We take your privacy seriously and comply with GDPR and data protection regulations.

## What We Collect

✓ Facial emotion data (only during quizzes, with consent)
✓ Quiz responses and performance metrics
✓ Interaction patterns and timing data
✓ Session data and timestamps
✓ Profile information you provide

## What We DON'T Collect

✗ Video or audio recordings
✗ Personal conversations
✗ Browsing history outside the app
✗ Location tracking
✗ Data shared with third parties (without consent)

## Your Rights

### Right to Access
Request a copy of all your data at any time

### Right to Delete
Request deletion of your data (some academic records may be retained per institutional policy)

### Right to Portability
Download your data in standard formats (JSON, CSV, PDF)

### Right to Opt-Out
Disable emotion tracking and data processing

### Right to Be Forgotten
Request complete account deletion

## Data Security

We protect your data through:
- End-to-end encryption
- Secure authentication (JWT tokens)
- Regular security audits
- HTTPS for all connections
- Encrypted database storage
- No data sold to third parties

## Exercising Your Rights

To exercise any of these rights:
1. Go to Settings → Data & Privacy
2. Choose your preferred action
3. Confirm your request
4. Receive confirmation within 72 hours

Or contact: privacy@emotionquiz.edu

## Questions?

For privacy concerns or questions:
- Email: privacy@emotionquiz.edu
- Review our full Privacy Policy
- Contact Data Protection Officer
    `,
    excerpt: "Understand your data privacy rights and how we protect your information.",
    targetRoles: ['all'],
    tags: ['privacy', 'GDPR', 'data-protection', 'rights', 'security'],
    readTime: "5 min read",
    icon: "Shield",
    order: 1,
    status: "published"
  },

  // Technical Support
  {
    title: "Camera Not Working - Troubleshooting",
    slug: "camera-not-working",
    category: "technical",
    content: `
# Camera Not Working - Troubleshooting Guide

Follow these steps to resolve camera issues.

## Quick Fixes

### 1. Check Browser Permissions
- Click the camera icon in address bar
- Ensure camera access is "Allowed"
- Reload the page after changing permissions

### 2. Close Other Applications
- Ensure no other app is using the camera
- Close video chat apps (Zoom, Teams, etc.)
- Close other browser tabs using camera

### 3. Refresh the Page
- Press F5 or Ctrl+R (Cmd+R on Mac)
- Clear cache if refresh doesn't work
- Try incognito/private mode

## Browser-Specific Solutions

### Chrome
1. Go to Settings → Privacy and Security
2. Click Site Settings → Camera
3. Allow emotionquiz.edu
4. Restart browser

### Firefox
1. Click site information icon
2. Select Permissions
3. Allow camera access
4. Reload page

### Safari
1. Go to Preferences → Websites
2. Click Camera
3. Allow for emotionquiz.edu
4. Restart Safari

## Hardware Issues

### Test Your Camera
- Visit browser's camera test page
- Check if camera works in other apps
- Ensure camera is properly connected
- Try external webcam if built-in fails

### Update Drivers
- Update camera drivers (Windows)
- Check System Preferences (Mac)
- Restart your computer

## Still Not Working?

If camera still doesn't work:
1. Document the issue with screenshots
2. Note your browser and OS versions
3. Contact your teacher about alternative arrangements
4. Email support with technical details

## Alternative Solutions

While camera is being fixed:
- Request emotion tracking to be disabled
- Take quiz without emotion features
- Use a different device
- Contact IT support at your institution
    `,
    excerpt: "Step-by-step guide to fix camera issues and troubleshoot technical problems.",
    targetRoles: ['all'],
    tags: ['technical', 'camera', 'troubleshooting', 'webcam', 'permissions'],
    readTime: "3 min read",
    icon: "Camera",
    order: 1,
    status: "published"
  },

  // FAQs
  {
    title: "Is emotion detection mandatory?",
    slug: "faq-emotion-detection-mandatory",
    category: "faq",
    content: "No, emotion detection is completely optional. Students can opt-out in Settings at any time, and teachers can also disable it per quiz. Your participation in emotion tracking is always voluntary, and you can use the platform fully without this feature enabled.",
    excerpt: "Learn about the optional nature of emotion detection.",
    targetRoles: ['all'],
    tags: ['faq', 'emotion', 'privacy', 'mandatory'],
    readTime: "1 min read",
    order: 1,
    status: "published"
  },

  {
    title: "Will emotions affect my grade?",
    slug: "faq-emotions-affect-grade",
    category: "faq",
    content: "No, emotions do not directly impact your grade. Emotional data provides context for feedback and helps teachers understand your learning experience, but grades are based solely on your quiz performance. The emotion tracking is designed to support you, not penalize you for feeling stressed or anxious.",
    excerpt: "Understand how emotional data relates to grading.",
    targetRoles: ['student', 'all'],
    tags: ['faq', 'grading', 'emotion', 'performance'],
    readTime: "1 min read",
    order: 2,
    status: "published"
  },

  {
    title: "Can I retake quizzes?",
    slug: "faq-retake-quizzes",
    category: "faq",
    content: "Retake options depend on your teacher's settings for each specific quiz. Some quizzes may allow unlimited retakes, others may allow a fixed number, and some may not allow retakes at all. Check the quiz details page or ask your teacher about their retake policy for specific assessments.",
    excerpt: "Learn about quiz retake policies.",
    targetRoles: ['student', 'all'],
    tags: ['faq', 'retake', 'quiz', 'policy'],
    readTime: "1 min read",
    order: 3,
    status: "published"
  }
];

const seedHelpContent = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/emotion-quiz');
    
    console.log('✅ Connected to MongoDB');

    // Clear existing help articles (optional - comment out if you want to keep existing)
    // await HelpArticle.deleteMany({});
    // console.log('🗑️ Cleared existing help articles');

    // Insert new articles
    const inserted = await HelpArticle.insertMany(helpArticles);
    console.log(`✅ Inserted ${inserted.length} help articles`);

    // Close connection
    await mongoose.connection.close();
    console.log('👋 Database connection closed');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding help content:', error);
    process.exit(1);
  }
};

// Run the seeder
seedHelpContent();