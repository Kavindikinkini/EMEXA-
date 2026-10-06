// backend/src/utils/emotionClassifier.js
//
// Single shared entry point for facial-emotion classification.
// Both emotionController.js (REST) and emotionSocket.js (live quiz)
// must call THIS function so there is exactly one implementation,
// one label-mapping table, and one friction-score table.

import { HfInference } from '@huggingface/inference';

// IMPORTANT: do NOT construct the client at module load time.
// ES module imports are hoisted and load before server.js's
// dotenv.config() call actually runs, so process.env.HF_API_KEY
// would still be undefined here if this ran eagerly. Instead,
// build it lazily on first real use.
let _hf = null;
let _hfChecked = false;

function getHfClient() {
  if (!_hfChecked) {
    _hfChecked = true;
    const key = process.env.HF_API_KEY;
    _hf = key && key !== 'hf_dummy_key_for_testing' ? new HfInference(key) : null;
  }
  return _hf;
}

export const MODEL_ID = 'dima806/facial_emotions_image_detection';

// Raw model output -> app-level emotion. NOTE: 'surprised' and 'disgust'
// map to 'confused' here — meaning 'confused' IS reachable from the
// classifier, not self-report-only. The conference paper (Sec. V-A)
// currently claims otherwise and needs correcting once this is verified
// end-to-end.
export const mapEmotion = (raw) => {
  const map = {
    happy: 'happy', joy: 'happy', excited: 'happy',
    sad: 'sad', disappointed: 'sad',
    angry: 'angry', frustrated: 'angry',
    confused: 'confused', surprised: 'confused', disgust: 'confused',
    fear: 'anxious', anxious: 'anxious',
    neutral: 'neutral', calm: 'neutral'
  };
  return map[raw?.toLowerCase()] || 'neutral';
};

export const frictionScore = {
  happy: 0, neutral: 1, sad: 3, confused: 4, anxious: 4, angry: 5
};

/**
 * Classify a single image buffer against the real HF model.
 * @param {Buffer} imageBuffer - raw image bytes
 * @param {string} mimeType - e.g. 'image/jpeg' or 'image/png', from the
 *   client's data URL. Required — the HF API rejects requests with no
 *   content type ("No content type provided and no default one configured").
 */
export async function classifyEmotion(imageBuffer, mimeType = 'image/jpeg') {
  const hf = getHfClient();
  if (!hf) {
    return { emotion: 'neutral', confidence: 1.0, frictionScore: 1, isFallback: true };
  }

  const result = await hf.imageClassification({
    data: new Blob([imageBuffer], { type: mimeType }),
    model: MODEL_ID
  });

  if (!result || result.length === 0) {
    throw new Error('Empty classification result from Hugging Face');
  }

  // Defensive sort — don't rely on the API always returning sorted output.
  const top = [...result].sort((a, b) => b.score - a.score)[0];

  const emotion = mapEmotion(top.label);
  const confidence = top.score;

  return {
    emotion,
    confidence,
    frictionScore: frictionScore[emotion] ?? 1,
    isFallback: false,
    rawLabel: top.label // keep the pre-mapping label — useful for the
                         // ground-truth validation study later
  };
}