const multer = require('multer');
const path = require('path');
const fs = require('fs');

// dossier temporaire
const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, filename);
  }
});

const upload = multer({ storage });

exports.uploadMiddleware = upload.single('image');

exports.uploadImage = (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'Aucun fichier envoyé' });
  const url = `/uploads/${req.file.filename}`;
  res.json({ url });
};
