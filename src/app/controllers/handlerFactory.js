const { catchAsync } = require('../../utils/functions');
const AppError = require('../../utils/appError');
// const APIFeatures = require('../../utils/apiFeatures');

exports.createOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.create(req.body);

    res.status(201).json({
      status: 'success',
      data: doc,
    });
  });

exports.updateOne = (Model) =>
  catchAsync(async (req, res, next) => {
    let doc = await Model.findByPk(req.params.id);

    if (!doc) {
      return next(new AppError('Nenhum documento com esta Id', 404));
    }

    doc = Object.assign(doc, req.body); // HACK mais ou menos, mysql n suporta o return true no update
    await doc.save();

    res.status(200).json({
      status: 'success',
      data: doc,
    });
  });

exports.deleteOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.destroy({ where: { id: req.params.id } });

    console.log(doc);
    if (!doc) {
      return next(new AppError('Nenhum documento com essa Id', 404));
    }

    res.status(204).send();
  });

exports.getOne = (Model, name, options = {}) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByPk(req.params.id, options);

    if (!doc) return next(new AppError(`Não há ${name} com este Id`, 404));

    res.status(200).json({
      status: 'success',
      data: doc,
    });
  });

exports.getAll = (Model, options = {}) =>
  catchAsync(async (req, res, next) => {
    let filters = {};
    if (Object.keys(req.query).length) {
      filters = { where: { ...req.query } };
    }
    // Une os dois objetos
    Object.assign(filters, options);

    const docs = await Model.findAll(filters);

    res.status(200).json({
      status: 'success',
      data: docs,
    });
  });
