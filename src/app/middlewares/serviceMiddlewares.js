const multer = require('multer');
const sharp = require('sharp');
const { resolve } = require('path');

const Service = require('../models/Service');
const multerConfig = require('../../config/multer');
const AppError = require('../../utils/appError');

const upload = multer(multerConfig);

exports.checkService = async (req, res, next) => {
  if (!(await Service.findByPk(req.params.id)))
    return next(new AppError('Nenhum serviço com este ID', 400));

  next();
};

// vai criar o req.file se tiver uma imagem
exports.uploadServiceIcon = upload.single('icon');

exports.resizeServiceIcon = (req, res, next) => {
  if (!req.file) return next();

  req.body.icon = `service-${req.params.id}-icon.png`;

  sharp(req.file.buffer)
    .resize(200, 200)
    .toFormat('png')
    .toFile(
      resolve(__dirname, '..', '..', '..', 'tmp', 'images', req.body.icon)
    );

  next();
};
