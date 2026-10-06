// test-emotion-classifier.js
// Run from backend/: node test-emotion-classifier.js path/to/a/selfie.jpg
//
// Tests the ACTUAL model EMEXA uses for emotion detection —
// test-hf-api.js does not cover this, it only tests chat/text models.

import { InferenceClient } from '@huggingface/inference';
import fs from 'fs';
import 'dotenv/config';

const imagePath = process.argv[2];

if (!imagePath) {
  console.log('Usage: node test-emotion-classifier.js path/to/image.jpg');
  console.log('Take a quick selfie with your webcam app (or any phone photo with a face), save it as a .jpg, and point this script at it.');
  process.exit(1);
}

if (!fs.existsSync(imagePath)) {
  console.log(`❌ File not found: ${imagePath}`);
  process.exit(1);
}

const apiKey = process.env.HF_API_KEY;
console.log(`🔑 API Key found: ${apiKey ? apiKey.slice(0, 10) + '...' : 'MISSING'}`);

if (!apiKey || apiKey === 'hf_dummy_key_for_testing') {
  console.log('❌ HF_API_KEY missing or still set to the dummy placeholder.');
  process.exit(1);
}

const hf = new InferenceClient(apiKey);
const MODEL_ID = 'dima806/facial_emotions_image_detection';

console.log(`\n📸 Testing image classification with ${MODEL_ID}`);
console.log('━'.repeat(50));

try {
  const imageBuffer = fs.readFileSync(imagePath);
  console.log(`Sending ${imageBuffer.length} bytes...`);

  const start = Date.now();
  const result = await hf.imageClassification({
    data: new Blob([imageBuffer], { type: 'image/jpeg' }),
    model: MODEL_ID
  });
  const elapsed = Date.now() - start;

  console.log(`✅ Response received in ${elapsed}ms\n`);
  console.log('Full label distribution:');
  const sorted = [...result].sort((a, b) => b.score - a.score);
  sorted.forEach(r => {
    const bar = '█'.repeat(Math.round(r.score * 30));
    console.log(`  ${r.label.padEnd(10)} ${(r.score * 100).toFixed(1)}%  ${bar}`);
  });

  console.log(`\nTop prediction: ${sorted[0].label} (${(sorted[0].score * 100).toFixed(1)}%)`);
  console.log('\nIf this looks like a real, varied confidence distribution across');
  console.log('categories (not always ~93%), the real classifier is working.');

} catch (error) {
  console.log('❌ Error calling the emotion classifier:');
  console.log(error.message);
  console.log('\nFull details:');
  console.log(error);
  console.log('\nCommon causes: model needs terms-of-use acceptance on huggingface.co,');
  console.log('key lacks Inference API permission, or image format/encoding issue.');
}
