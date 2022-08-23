const Appointment = require('../models/Appointment');
const factory = require('./handlerFactory');

exports.createAppointment = factory.createOne(Appointment);
exports.getAllAppointments = factory.getAll(Appointment, {
  include: [
    {
      association: 'barber',
      attributes: ['id'],
      include: [
        {
          association: 'user',
          attributes: ['name'],
        },
      ],
    },
    {
      association: 'service',
      attributes: ['name'],
    },
    {
      association: 'user',
      attributes: ['name'],
    },
  ],
});
exports.deleteAppointment = factory.deleteOne(Appointment);
