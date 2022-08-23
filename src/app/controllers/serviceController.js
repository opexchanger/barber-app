const Service = require('../models/Service');
const factory = require('./handlerFactory');

exports.createService = factory.createOne(Service);
exports.getService = factory.getOne(Service, 'serviço');
exports.getAllServices = factory.getAll(Service);
exports.updateService = factory.updateOne(Service);
exports.deleteService = factory.deleteOne(Service);
