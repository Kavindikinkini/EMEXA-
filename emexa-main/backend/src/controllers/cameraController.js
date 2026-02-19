import fs from 'fs';
import path from 'path';

export const postFrame = async (req, res) => {
  try {
    const { image, quizId, userId, timestamp } = req.body || {};

    if (!image || typeof image !== 'string') {
      return res.status(400).json({ ok: false, message: 'Missing image data' });
    }

    const matches = image.match(/^data:(.+);base64,(.+)$/);
    if (!matches) {
      return res.status(400).json({ ok: false, message: 'Invalid image data' });
    }

    const mime = matches[1];
    const base64Data = matches[2];
    const ext = mime.split('/')[1] || 'jpg';

    const uploadsDir = path.resolve(process.cwd(), 'backend', 'uploads');
    await fs.promises.mkdir(uploadsDir, { recursive: true });

    const fileName = `${Date.now()}_${quizId || 'quiz'}_${userId || 'anon'}.${ext}`;
    const filePath = path.join(uploadsDir, fileName);

    const buffer = Buffer.from(base64Data, 'base64');
    await fs.promises.writeFile(filePath, buffer);

    return res.status(201).json({ ok: true, file: fileName, timestamp: timestamp || Date.now() });
  } catch (err) {
    console.error('postFrame error:', err);
    return res.status(500).json({ ok: false, message: 'Server error' });
  }
};

export default { postFrame };
