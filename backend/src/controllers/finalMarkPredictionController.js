import QuizAttempt from '../models/quizAttempt.js';
import EmotionLog from '../models/emotionLog.js';
import Student from '../models/student.js';
import FinalMarkPrediction from '../models/finalMarkPrediction.js';

// ─────────────────────────────────────────────────────────────────────────────
// HELPER: K-Means clustering (pure JS, no external ML lib)
// Clusters students into 3 groups based on [avgScore, confidenceIndex]
// ─────────────────────────────────────────────────────────────────────────────
function kMeans(points, k = 3, iterations = 50) {
  if (points.length < k) {
    return points.map((_, i) => i % k);
  }

  let centroids = [
    { score: 20, conf: 20 },
    { score: 55, conf: 55 },
    { score: 85, conf: 80 }
  ];

  let assignments = new Array(points.length).fill(0);

  for (let iter = 0; iter < iterations; iter++) {
    assignments = points.map(p => {
      let minDist = Infinity, nearest = 0;
      centroids.forEach((c, ci) => {
        const dist = Math.hypot(p.score - c.score, p.conf - c.conf);
        if (dist < minDist) { minDist = dist; nearest = ci; }
      });
      return nearest;
    });

    const newCentroids = Array.from({ length: k }, () => ({ score: 0, conf: 0, count: 0 }));
    points.forEach((p, i) => {
      newCentroids[assignments[i]].score += p.score;
      newCentroids[assignments[i]].conf  += p.conf;
      newCentroids[assignments[i]].count++;
    });
    centroids = newCentroids.map((c, ci) =>
      c.count > 0
        ? { score: c.score / c.count, conf: c.conf / c.count }
        : centroids[ci]
    );
  }

  return assignments;
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPER: Build feature vector for one student
// ─────────────────────────────────────────────────────────────────────────────
async function buildStudentFeatures(studentMongoId) {
  const attempts = await QuizAttempt.find({ userId: studentMongoId })
    .sort({ completedAt: -1 })
    .limit(20)
    .lean();

  const emotionLogs = await EmotionLog.find({ userId: studentMongoId })
    .sort({ timestamp: -1 })
    .limit(500)
    .lean();

  if (attempts.length === 0) return null;

  // ── Quiz features ────────────────────────────────────────────────────────
  const scores  = attempts.map(a => a.finalScore ?? a.rawScore ?? 0);
  const avgScore = scores.reduce((s, v) => s + v, 0) / scores.length;
  const hintsAvg = attempts.reduce((s, a) => s + (a.hintsUsed || 0), 0) / attempts.length;

  // Score trend: compare chronological first half vs second half
  const chronoScores = [...scores].reverse();
  let scoreTrend = 'stable';
  if (chronoScores.length >= 4) {
    const mid = Math.floor(chronoScores.length / 2);
    const firstHalf  = chronoScores.slice(0, mid).reduce((s, v) => s + v, 0) / mid;
    const secondHalf = chronoScores.slice(mid).reduce((s, v) => s + v, 0) / (chronoScores.length - mid);
    if (secondHalf - firstHalf > 5)  scoreTrend = 'improving';
    if (firstHalf  - secondHalf > 5) scoreTrend = 'declining';
  }

  // ── Emotion features ─────────────────────────────────────────────────────
  const total = emotionLogs.length || 1;
  const counts = { happy: 0, sad: 0, angry: 0, confused: 0, neutral: 0, anxious: 0 };
  let confSum = 0, frictionSum = 0;

  emotionLogs.forEach(log => {
    counts[log.emotion] = (counts[log.emotion] || 0) + 1;
    confSum     += log.confidence   || 0;
    frictionSum += log.frictionScore || 1;
  });

  const happyRatio    = counts.happy    / total;
  const confusedRatio = counts.confused / total;
  const anxiousRatio  = counts.anxious  / total;
  const angryRatio    = counts.angry    / total;
  const neutralRatio  = counts.neutral  / total;
  const avgConfidence = confSum    / total;
  const avgFriction   = frictionSum / total;

  const stressIndex     = Math.min(100, Math.round(
    (angryRatio * 0.35 + anxiousRatio * 0.35 + confusedRatio * 0.30) * 100
  ));
  const confidenceIndex = Math.min(100, Math.round(
    (happyRatio * 0.6 + neutralRatio * 0.4) * 100
  ));

  const dominantEmotion = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])[0][0];

  return {
    avgScore, hintsAvg, scoreTrend,
    quizCount: attempts.length,
    emotionLogCount: emotionLogs.length,
    happyRatio, confusedRatio, anxiousRatio, angryRatio, neutralRatio,
    avgConfidence, avgFriction,
    stressIndex, confidenceIndex, dominantEmotion
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPER: Classification → predicted score + risk
// ─────────────────────────────────────────────────────────────────────────────
function classify(features, clusterLabel) {
  const { avgScore, stressIndex, confidenceIndex, scoreTrend, hintsAvg } = features;

  let predicted = avgScore * 0.55
    + confidenceIndex * 0.20
    - stressIndex     * 0.15
    - hintsAvg        * 0.5;

  if (scoreTrend === 'improving') predicted += 5;
  if (scoreTrend === 'declining') predicted -= 5;
  if (clusterLabel === 'high-performer') predicted += 3;
  if (clusterLabel === 'at-risk')        predicted -= 5;

  predicted = Math.max(0, Math.min(100, Math.round(predicted)));

  let riskLevel = 'medium';
  if (predicted >= 65 && stressIndex < 40) riskLevel = 'low';
  else if (predicted < 40 || stressIndex > 65) riskLevel = 'high';

  return { predictedScore: predicted, riskLevel };
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPER: Human-readable summaries
// ─────────────────────────────────────────────────────────────────────────────
function buildSummaries(features, clusterLabel) {
  const { dominantEmotion, stressIndex, confidenceIndex,
          scoreTrend, avgScore, quizCount, hintsAvg } = features;

  let readinessLabel = 'moderately-prepared';
  if (confidenceIndex >= 60 && stressIndex < 35) readinessLabel = 'well-prepared';
  else if (stressIndex >= 60 || confidenceIndex < 30) readinessLabel = 'needs-support';

  const psychSummary = readinessLabel === 'well-prepared'
    ? `Student shows strong emotional stability. Dominant emotion is "${dominantEmotion}" with confidence ${confidenceIndex}% and low stress (${stressIndex}%). Psychologically ready for the exam.`
    : readinessLabel === 'needs-support'
    ? `Student shows signs of emotional difficulty. High stress (${stressIndex}%), low confidence (${confidenceIndex}%). Dominant emotion: "${dominantEmotion}". Recommend support before the exam.`
    : `Student shows moderate emotional readiness. Confidence ${confidenceIndex}%, stress ${stressIndex}%. Dominant emotion: "${dominantEmotion}".`;

  const trendText  = scoreTrend === 'improving' ? 'improving trend'
                   : scoreTrend === 'declining'  ? 'declining trend' : 'stable trend';
  const physSummary = `Based on ${quizCount} quiz attempt(s), average score is ${Math.round(avgScore)}% with a ${trendText}. Average hints used: ${hintsAvg.toFixed(1)}. Cluster: ${clusterLabel.replace(/-/g, ' ')}.`;

  return { readinessLabel, psychSummary, physSummary };
}

// ─────────────────────────────────────────────────────────────────────────────
// CORE: Generate (or refresh) prediction for ONE student under ONE teacher
// ─────────────────────────────────────────────────────────────────────────────
export async function generatePredictionForStudent(studentMongoId, teacherMongoId) {
  const student = await Student.findById(studentMongoId).lean();
  if (!student) throw new Error('Student not found');

  const features = await buildStudentFeatures(studentMongoId);

  if (!features) {
    await FinalMarkPrediction.findOneAndUpdate(
      { studentId: studentMongoId, teacherId: teacherMongoId },
      {
        clusterLabel: 'insufficient-data',
        predictedScore: null,
        riskLevel: 'medium',
        status: 'pending',
        generatedAt: new Date(),
        $inc: { version: 1 }
      },
      { upsert: true, new: true }
    );
    return;
  }

  // ── Cluster across all students of this teacher ──────────────────────────
  const existingPredictions = await FinalMarkPrediction.find({ teacherId: teacherMongoId }).lean();
  const allStudentIds = [...new Set([
    ...existingPredictions.map(p => p.studentId.toString()),
    studentMongoId.toString()
  ])];

  const vectorPromises = allStudentIds.map(async sid => {
    const f = await buildStudentFeatures(sid);
    return f ? { id: sid, score: f.avgScore, conf: f.confidenceIndex } : null;
  });
  const vectors = (await Promise.all(vectorPromises)).filter(Boolean);

  let clusterLabel = 'average-performer';

  if (vectors.length >= 3) {
    const assignments = kMeans(vectors, 3);
    const centroids = [0, 1, 2].map(ci => {
      const members = vectors.filter((_, i) => assignments[i] === ci);
      return { ci, avg: members.length ? members.reduce((s, m) => s + m.score, 0) / members.length : 0 };
    }).sort((a, b) => a.avg - b.avg);

    const rankMap = {};
    centroids.forEach((c, rank) => { rankMap[c.ci] = rank; });

    const myVector = vectors.find(v => v.id === studentMongoId.toString());
    if (myVector) {
      const myIdx  = vectors.indexOf(myVector);
      const myRank = rankMap[assignments[myIdx]];
      clusterLabel = myRank === 0 ? 'at-risk'
                   : myRank === 2 ? 'high-performer'
                   : 'average-performer';
    }
  } else {
    clusterLabel = features.avgScore >= 70 ? 'high-performer'
                 : features.avgScore >= 40 ? 'average-performer'
                 : 'at-risk';
  }

  const { predictedScore, riskLevel }      = classify(features, clusterLabel);
  const { readinessLabel, psychSummary, physSummary } = buildSummaries(features, clusterLabel);

  const updatePayload = {
    teacherId: teacherMongoId,
    clusterLabel,
    clusterScore:   Math.round(features.avgScore),
    predictedScore,
    riskLevel,
    status:         'pending',
    approvedAt:     null,
    generatedAt:    new Date(),
    psychologicalReadiness: {
      dominantEmotion:  features.dominantEmotion,
      stressIndex:      features.stressIndex,
      confidenceIndex:  features.confidenceIndex,
      frictionAvg:      parseFloat(features.avgFriction.toFixed(2)),
      readinessLabel,
      summary:          psychSummary
    },
    physicalReadiness: {
      avgScore:         Math.round(features.avgScore),
      totalQuizzesTaken: features.quizCount,
      scoretrend:       features.scoreTrend,
      hintsUsedAvg:     parseFloat(features.hintsAvg.toFixed(2)),
      summary:          physSummary
    },
    dataSnapshot: {
      quizCount:        features.quizCount,
      avgQuizScore:     Math.round(features.avgScore),
      emotionLogCount:  features.emotionLogCount,
      happyRatio:       parseFloat(features.happyRatio.toFixed(3)),
      confusedRatio:    parseFloat(features.confusedRatio.toFixed(3)),
      anxiousRatio:     parseFloat(features.anxiousRatio.toFixed(3)),
      angryRatio:       parseFloat(features.angryRatio.toFixed(3)),
      neutralRatio:     parseFloat(features.neutralRatio.toFixed(3)),
      avgConfidence:    parseFloat(features.avgConfidence.toFixed(3)),
      avgFriction:      parseFloat(features.avgFriction.toFixed(3))
    },
    $inc: { version: 1 }
  };

  await FinalMarkPrediction.findOneAndUpdate(
    { studentId: studentMongoId, teacherId: teacherMongoId },
    updatePayload,
    { upsert: true, new: true }
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ROUTE HANDLERS
// ─────────────────────────────────────────────────────────────────────────────

// GET /api/predictions/teacher/all
export async function getTeacherPredictions(req, res) {
  try {
    const teacherId = req.user.id;
    const predictions = await FinalMarkPrediction.find({ teacherId })
      .populate('studentId', 'name email studentId grade year semester profileImage')
      .sort({ updatedAt: -1 })
      .lean();
    res.json({ success: true, predictions });
  } catch (err) {
    console.error('getTeacherPredictions error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
}

// POST /api/predictions/generate/:studentId  (teacher manually triggers)
export async function triggerPrediction(req, res) {
  try {
    const teacherId  = req.user.id;
    const { studentId } = req.params;
    await generatePredictionForStudent(studentId, teacherId);
    const prediction = await FinalMarkPrediction.findOne({ studentId, teacherId })
      .populate('studentId', 'name email studentId grade')
      .lean();
    res.json({ success: true, prediction });
  } catch (err) {
    console.error('triggerPrediction error:', err);
    res.status(500).json({ success: false, message: err.message || 'Server error' });
  }
}

// PATCH /api/predictions/:predictionId/approve
export async function approvePrediction(req, res) {
  try {
    const { predictionId } = req.params;
    const { adjustedScore, teacherNote } = req.body;
    const teacherId = req.user.id;

    const prediction = await FinalMarkPrediction.findOne({ _id: predictionId, teacherId });
    if (!prediction) return res.status(404).json({ success: false, message: 'Prediction not found' });

    prediction.status     = 'approved';
    prediction.approvedAt = new Date();
    if (adjustedScore !== undefined && adjustedScore !== null)
      prediction.adjustedScore = Math.max(0, Math.min(100, Number(adjustedScore)));
    if (teacherNote !== undefined)
      prediction.teacherNote = teacherNote;

    await prediction.save();
    res.json({ success: true, prediction });
  } catch (err) {
    console.error('approvePrediction error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
}

// PATCH /api/predictions/:predictionId/reject
export async function rejectPrediction(req, res) {
  try {
    const { predictionId } = req.params;
    const { teacherNote }  = req.body;
    const teacherId        = req.user.id;

    const prediction = await FinalMarkPrediction.findOne({ _id: predictionId, teacherId });
    if (!prediction) return res.status(404).json({ success: false, message: 'Prediction not found' });

    prediction.status = 'rejected';
    if (teacherNote) prediction.teacherNote = teacherNote;
    await prediction.save();
    res.json({ success: true, prediction });
  } catch (err) {
    console.error('rejectPrediction error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
}

// GET /api/predictions/student/me
export async function getStudentPrediction(req, res) {
  try {
    const studentId = req.user.id;
    const prediction = await FinalMarkPrediction.findOne({ studentId, status: 'approved' })
      .populate('teacherId', 'name teacherId')
      .sort({ approvedAt: -1 })
      .lean();

    if (!prediction) return res.json({ success: true, prediction: null });

    res.json({
      success: true,
      prediction: { ...prediction, finalScore: prediction.adjustedScore ?? prediction.predictedScore }
    });
  } catch (err) {
    console.error('getStudentPrediction error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
}

// GET /api/predictions/classroom-overview
export async function getClassroomOverview(req, res) {
  try {
    const teacherId   = req.user.id;
    const predictions = await FinalMarkPrediction.find({ teacherId })
      .populate('studentId', 'name studentId year semester')
      .lean();

    const overview = {
      total:    predictions.length,
      approved: predictions.filter(p => p.status === 'approved').length,
      pending:  predictions.filter(p => p.status === 'pending').length,
      clusters: {
        'high-performer':    predictions.filter(p => p.clusterLabel === 'high-performer').length,
        'average-performer': predictions.filter(p => p.clusterLabel === 'average-performer').length,
        'at-risk':           predictions.filter(p => p.clusterLabel === 'at-risk').length,
        'insufficient-data': predictions.filter(p => p.clusterLabel === 'insufficient-data').length
      },
      riskBreakdown: {
        low:    predictions.filter(p => p.riskLevel === 'low').length,
        medium: predictions.filter(p => p.riskLevel === 'medium').length,
        high:   predictions.filter(p => p.riskLevel === 'high').length
      },
      avgPredictedScore: predictions.length
        ? Math.round(predictions.reduce((s, p) => s + (p.predictedScore || 0), 0) / predictions.length)
        : 0,
      students: predictions.map(p => ({
        studentId:      p.studentId,
        clusterLabel:   p.clusterLabel,
        riskLevel:      p.riskLevel,
        predictedScore: p.adjustedScore ?? p.predictedScore,
        status:         p.status,
        readinessLabel: p.psychologicalReadiness?.readinessLabel
      }))
    };

    res.json({ success: true, overview });
  } catch (err) {
    console.error('getClassroomOverview error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
}