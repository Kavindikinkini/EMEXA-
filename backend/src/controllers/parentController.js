import User from '../models/user.js';
import Student from '../models/student.js';
import ParentLink from '../models/parentLink.js';
import QuizAttempt from '../models/quizAttempt.js';
import EmotionLog from '../models/emotionLog.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

// ─────────────────────────────────────────────
// REGISTER PARENT
// ─────────────────────────────────────────────
export const registerParent = async (req, res) => {
  try {
    const { name, email, password, childEmail } = req.body;

    if (!name || !email || !password || !childEmail) {
      return res.status(400).json({ message: 'All fields are required including child email' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const normalizedChildEmail = childEmail.toLowerCase().trim();

    // Check parent email not already used
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    // Find the child in Student collection
    const child = await Student.findOne({ email: normalizedChildEmail });
    if (!child) {
      return res.status(404).json({ 
        message: 'No approved student found with that email. Please check the email address.' 
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create parent user — role: 'parent', auto-approved (no admin approval needed)
    const parent = new User({
      name,
      email: normalizedEmail,
      password: hashedPassword,
      role: 'parent',
      approvalStatus: 'approved',
      status: 'Active',
      isActive: true
    });
    await parent.save();

    // Create the parent-child link
    await ParentLink.create({
      parentId:     parent._id,
      studentId:    child._id,
      studentName:  child.name,
      studentEmail: child.email,
      consentLevel: 'full',
      notifyBurnout: true,
      notifyWeekly:  true
    });

    console.log(`✅ Parent registered: ${email} linked to child: ${childEmail}`);

    res.status(201).json({
      message: 'Parent account created successfully',
      parent: { id: parent._id, name: parent.name, email: parent.email, role: 'parent' }
    });

  } catch (err) {
    console.error('❌ Parent register error:', err);
    res.status(500).json({ message: 'Server error during registration' });
  }
};

// ─────────────────────────────────────────────
// LOGIN PARENT
// ─────────────────────────────────────────────
export const loginParent = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password required' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const parent = await User.findOne({ email: normalizedEmail, role: 'parent' }).select('+password');
    if (!parent) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isValid = await bcrypt.compare(password, parent.password);
    if (!isValid) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { id: parent._id, email: parent.email, role: 'parent' },
      process.env.JWT_SECRET || 'dev_secret',
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: { id: parent._id, name: parent.name, email: parent.email, role: 'parent' }
    });

  } catch (err) {
    console.error('❌ Parent login error:', err);
    res.status(500).json({ message: 'Server error during login' });
  }
};

// ─────────────────────────────────────────────
// GET LINKED CHILDREN
// ─────────────────────────────────────────────
export const getMyChildren = async (req, res) => {
  try {
    const links = await ParentLink.find({ parentId: req.userId });

    // Fill in missing studentName from Student collection
    const enriched = await Promise.all(links.map(async (link) => {
      const obj = link.toObject();
      if (!obj.studentName) {
        const student = await Student.findById(obj.studentId).select('name');
        obj.studentName = student?.name || obj.studentEmail?.split('@')[0] || 'Student';
      }
      return obj;
    }));

    res.json({ children: enriched });
  } catch (err) {
    console.error('❌ getMyChildren error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ─────────────────────────────────────────────
// GET CHILD DASHBOARD DATA
// ─────────────────────────────────────────────
export const getChildDashboard = async (req, res) => {
  try {
    const { childId } = req.params;

    // Verify this parent is linked to this child
    const link = await ParentLink.findOne({ parentId: req.userId, studentId: childId });
    if (!link) {
      return res.status(403).json({ message: 'You are not linked to this student' });
    }

    // Get child info
    const child = await Student.findById(childId).select('-password');
    if (!child) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Get quiz attempts (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const attempts = await QuizAttempt.find({
      userId: childId,
      createdAt: { $gte: thirtyDaysAgo }
    }).sort({ createdAt: -1 });

    // Get emotion logs (last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const emotionLogs = await EmotionLog.find({
      userId: childId,
      createdAt: { $gte: sevenDaysAgo }
    });

    // ── Calculate Emotional Health Score (0-100) ──
    const emotionWeights = { happy: 100, neutral: 60, surprised: 70, confused: 30, sad: 20, angry: 10, fear: 10 };
    const emotionHealthScore = emotionLogs.length > 0
      ? Math.round(emotionLogs.reduce((sum, log) => sum + (emotionWeights[log.emotion] || 50), 0) / emotionLogs.length)
      : 50;

    // ── Dominant emotion ──
    const emotionCounts = {};
    emotionLogs.forEach(log => {
      emotionCounts[log.emotion] = (emotionCounts[log.emotion] || 0) + 1;
    });
    const dominantEmotion = Object.keys(emotionCounts).length > 0
      ? Object.entries(emotionCounts).sort((a, b) => b[1] - a[1])[0][0]
      : 'neutral';

    // ── Average score ──
    const avgScore = attempts.length > 0
      ? Math.round(attempts.reduce((sum, a) => sum + (a.finalScore || 0), 0) / attempts.length)
      : 0;

    // ── Weekly score trend (last 7 quizzes) ──
    const weeklyTrend = attempts.slice(0, 7).reverse().map((a, i) => ({
      label: `Quiz ${i + 1}`,
      score: a.finalScore || 0,
      date: a.createdAt
    }));

    // ── Burnout risk (simplified) ──
    const negativeEmotions = ['sad', 'angry', 'confused', 'fear'];
    const negativeCount = emotionLogs.filter(l => negativeEmotions.includes(l.emotion)).length;
    const negativeRatio = emotionLogs.length > 0 ? negativeCount / emotionLogs.length : 0;
    const recentScores = attempts.slice(0, 3).map(a => a.finalScore || 0);
    const avgRecentScore = recentScores.length > 0 ? recentScores.reduce((a, b) => a + b, 0) / recentScores.length : 50;
    const burnoutScore = Math.min(100, Math.round((negativeRatio * 50) + (avgRecentScore < 40 ? 30 : 0)));
    const burnoutLevel = burnoutScore >= 70 ? 'Critical' : burnoutScore >= 50 ? 'High' : burnoutScore >= 30 ? 'Moderate' : 'Low';

    // ── Emotion distribution for chart ──
    const totalEmotions = emotionLogs.length || 1;
    const emotionDistribution = {
      happy:     Math.round(((emotionCounts.happy || 0) / totalEmotions) * 100),
      neutral:   Math.round(((emotionCounts.neutral || 0) / totalEmotions) * 100),
      confused:  Math.round(((emotionCounts.confused || 0) / totalEmotions) * 100),
      sad:       Math.round(((emotionCounts.sad || 0) / totalEmotions) * 100),
      angry:     Math.round(((emotionCounts.angry || 0) / totalEmotions) * 100),
      fear:      Math.round(((emotionCounts.fear || 0) / totalEmotions) * 100),
    };

    // ── Traffic light ──
    let trafficLight = 'green';
    if (burnoutScore >= 50 || emotionHealthScore < 30) trafficLight = 'red';
    else if (burnoutScore >= 30 || emotionHealthScore < 50) trafficLight = 'yellow';

    res.json({
      child: {
        id: child._id,
        name: child.name,
        email: child.email,
        profileImage: child.profileImage,
        year: child.year,
        semester: child.semester
      },
      emotionalHealth: {
        score: emotionHealthScore,
        dominantEmotion,
        emotionDistribution,
        trafficLight
      },
      academic: {
        totalQuizzes: attempts.length,
        averageScore: avgScore,
        weeklyTrend,
        recentAttempts: attempts.slice(0, 5).map(a => ({
          score: a.finalScore,
          hintsUsed: a.hintsUsed || 0,
          date: a.createdAt
        }))
      },
      burnout: {
        score: burnoutScore,
        level: burnoutLevel
      },
      consentLevel: link.consentLevel
    });

  } catch (err) {
    console.error('❌ getChildDashboard error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ─────────────────────────────────────────────
// GET WEEKLY SUMMARY (for email digest display)
// ─────────────────────────────────────────────
export const getWeeklySummary = async (req, res) => {
  try {
    const { childId } = req.params;

    const link = await ParentLink.findOne({ parentId: req.userId, studentId: childId });
    if (!link) return res.status(403).json({ message: 'Not linked to this student' });

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const emotionLogs = await EmotionLog.find({ userId: childId, createdAt: { $gte: sevenDaysAgo } });
    const attempts    = await QuizAttempt.find({ userId: childId, createdAt: { $gte: sevenDaysAgo } });

    // Emotion counts
    const counts = {};
    emotionLogs.forEach(l => { counts[l.emotion] = (counts[l.emotion] || 0) + 1; });
    const dominant = Object.keys(counts).length > 0
      ? Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0]
      : 'neutral';

    const calmCount    = (counts.happy || 0) + (counts.neutral || 0);
    const calmRate     = emotionLogs.length > 0 ? Math.round((calmCount / emotionLogs.length) * 100) : 0;
    const avgScore     = attempts.length > 0
      ? Math.round(attempts.reduce((s, a) => s + (a.finalScore || 0), 0) / attempts.length)
      : 0;

    // Traffic light
    const negRatio = emotionLogs.length > 0
      ? ['sad','angry','fear','confused'].reduce((s, e) => s + (counts[e] || 0), 0) / emotionLogs.length
      : 0;
    const trafficLight = negRatio > 0.5 ? 'red' : negRatio > 0.3 ? 'yellow' : 'green';

    // Conversation starter
    const starters = {
      confused: "Ask them which quiz topic felt most confusing this week.",
      sad:      "Check in on how they've been feeling about school lately.",
      angry:    "Ask if anything about their quizzes felt frustrating or unfair.",
      happy:    "Celebrate with them — ask what went well this week!",
      neutral:  "Ask them to tell you one thing they learned this week.",
      fear:     "Reassure them that making mistakes is part of learning.",
    };

    res.json({
      week: { from: sevenDaysAgo, to: new Date() },
      dominantEmotion: dominant,
      calmRate,
      averageScore: avgScore,
      totalQuizzes: attempts.length,
      trafficLight,
      conversationStarter: starters[dominant] || starters.neutral,
      aiSummary: generateAISummary(dominant, avgScore, calmRate, attempts.length)
    });

  } catch (err) {
    console.error('❌ getWeeklySummary error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ─────────────────────────────────────────────
// UPDATE CONSENT SETTINGS
// ─────────────────────────────────────────────
export const updateConsent = async (req, res) => {
  try {
    const { childId }      = req.params;
    const { consentLevel, notifyBurnout, notifyWeekly } = req.body;

    const link = await ParentLink.findOneAndUpdate(
      { parentId: req.userId, studentId: childId },
      { consentLevel, notifyBurnout, notifyWeekly },
      { new: true }
    );

    if (!link) return res.status(404).json({ message: 'Link not found' });

    res.json({ message: 'Settings updated', link });
  } catch (err) {
    console.error('❌ updateConsent error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ─────────────────────────────────────────────
// HELPER — simple AI-style summary string
// ─────────────────────────────────────────────
function generateAISummary(emotion, avgScore, calmRate, quizCount) {
  if (quizCount === 0) return "No quiz activity this week. Encourage them to log in and try a quiz!";
  if (calmRate >= 70 && avgScore >= 70) return `A strong week — your child completed ${quizCount} quiz${quizCount > 1 ? 'zes' : ''} with mostly calm emotions and solid scores.`;
  if (calmRate >= 70 && avgScore < 70) return `Your child stayed emotionally calm this week but scores suggest some content areas need review.`;
  if (calmRate < 40) return `Your child showed signs of stress across ${quizCount} quiz${quizCount > 1 ? 'zes' : ''} this week. A supportive check-in at home would help.`;
  return `Your child had a mixed week — ${quizCount} quiz${quizCount > 1 ? 'zes' : ''} completed. Keep encouraging consistent effort.`;
}