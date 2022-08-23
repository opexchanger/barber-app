const multer = require('multer');

const AppError = require('../utils/appError');

module.exports = {
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image')) {
      cb(null, true);
    } else {
      cb(new AppError('Arquivo selecionado não é uma imagem', 400), false);
    }
  },
};

// multer.diskStorage({
//   destination: resolve(__dirname, '..', '..', 'tmp', 'images'),

//   filename: (req, file, cb) => {
//     crypto.randomBytes(16, (err, buff) => {
//       if (err) return cb(err);

//       cb(null, buff.toString('hex') + extname(file.originalname));
//     });
//   },
// })
