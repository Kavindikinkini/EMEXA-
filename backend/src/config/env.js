import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from backend root (two levels up from config folder)
const envPath = path.resolve(__dirname, '..', '..', '.env');
console.log('📁 Loading .env from:', envPath);

const result = dotenv.config({ path: envPath });

if (result.error) {
  console.error('❌ ERROR: Could not load .env file!');
  console.error('   Error:', result.error.message);
  console.error('   Expected location:', envPath);
  process.exit(1);
}

console.log('✅ .env file loaded successfully!\n');

// Validate Cloudinary variables immediately
if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
  console.error('❌ FATAL: Cloudinary environment variables missing!');
  console.error('CLOUDINARY_CLOUD_NAME:', process.env.CLOUDINARY_CLOUD_NAME || 'MISSING');
  console.error('CLOUDINARY_API_KEY:', process.env.CLOUDINARY_API_KEY || 'MISSING');
  console.error('CLOUDINARY_API_SECRET:', process.env.CLOUDINARY_API_SECRET ? 'SET' : 'MISSING');
  process.exit(1);
}

console.log('✅ Cloudinary environment variables detected');

export default {};