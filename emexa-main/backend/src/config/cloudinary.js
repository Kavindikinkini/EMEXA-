import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';

console.log('\n🌥️  ===== CLOUDINARY LOADING =====');
console.log('Configuring Cloudinary...');

// Use environment variables (they will be loaded by dotenv in server.js)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dzgcf6sdh',
  api_key: process.env.CLOUDINARY_API_KEY || '282114754717944',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'TyjwJPWhJ4p2m7z3ewFtTEvAVGg'
});

console.log('Cloud name:', process.env.CLOUDINARY_CLOUD_NAME || 'dzgcf6sdh');
console.log('API key:', process.env.CLOUDINARY_API_KEY || '282114754717944');
console.log('✅ Cloudinary configured!');
console.log('====================================\n');

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'emexa/profiles',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp','avif'],
    public_id: (req, file) => `profile_${Date.now()}`,
    transformation: [{ width: 500, height: 500, crop: 'limit' }]
  }
});

export { cloudinary, storage };