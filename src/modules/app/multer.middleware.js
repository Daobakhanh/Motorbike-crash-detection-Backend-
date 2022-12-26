const multer = require('multer');

const imageFileFilter = (req, file, cb) => {
  if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type'));
  }
};

const storage = multer.memoryStorage();

const imageUpload = multer({
  storage: storage,
  fileFilter: imageFileFilter,
});

module.exports = { imageUpload };
