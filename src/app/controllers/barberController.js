const { parseISO, startOfDay, endOfDay, format, isAfter } = require('date-fns');
const { Op } = require('sequelize');

const Barber = require('../models/Barber');
const BarberService = require('../models/Barber_Service');
const AppError = require('../../utils/appError');

const factory = require('./handlerFactory');
const { catchAsync } = require('../../utils/functions');

exports.createBarber = factory.createOne(Barber);
exports.getAllBarbers = factory.getAll(Barber, {
  include: [
    {
      association: 'user',
      attributes: ['name'],
    },
  ],
});
exports.getBarber = factory.getOne(Barber, 'barbeiro', {
  include: [
    {
      association: 'user',
      attributes: ['name', 'phone_number'],
    },
    {
      association: 'services',
      through: {
        attributes: ['price', 'duration'],
      },
      required: false,
    },
  ],
});
exports.updateBarber = factory.updateOne(Barber);
exports.addServiceToBarber = factory.createOne(BarberService);

/**
 * GET BARBER APPOINTMENTS
 */
exports.getBarberAppointments = catchAsync(async (req, res, next) => {
  // VERIFICA E PEGA A DATA DOS AGENDAMENTOS
  if (!req.query.date)
    return next(new AppError('Informe a data a ser procurada', 400));

  const date = parseISO(req.query.date);

  // BUSCA O BARBEIRO LOGADO
  const barber = await Barber.findByPk(req.params.id);

  // BUSCA OS AGENDAMENTOS DO BARBEIRO PARA ESSE DIA
  const appointments = await barber.getAppointments({
    where: {
      status: 'pendente',
      hour: {
        [Op.between]: [startOfDay(date), endOfDay(date)],
      },
    },
    include: [
      {
        association: 'user',
        attributes: ['name', 'phone_number'],
      },
    ],
  });

  res.status(200).json({
    status: 'success',
    data: appointments,
  });
});

/**
 * GET BARBER SCHEDULE
 */
exports.getBarberSchedule = catchAsync(async (req, res, next) => {
  // VERIFICA E PEGA A DATA DOS AGENDAMENTOS
  if (!req.query.date)
    return next(new AppError('Informe a data a ser procurada', 400));
  const date = parseISO(req.query.date);

  // VERIFICA E PEGA O BARBER SELECIONADO
  const barber = await Barber.findByPk(req.params.id);
  if (!barber) return next(new AppError('Não há barbeiro com este ID', 400));

  // BUSCA OS AGENDAMENTOS DO BARBEIRO PARA ESSE DIA
  const appointments = await barber.getAppointments({
    where: {
      status: 'pendente',
      hour: {
        [Op.between]: [startOfDay(date), endOfDay(date)],
      },
    },
  });

  // MONTA O ARRAY COM HORÁRIOS QUE O BARBEIRO TRABALHA
  let i = Number(`${barber.hour_start}`.split(':')[0]);
  const f = Number(`${barber.hour_finish}`.split(':')[0]);
  const schedule = [];

  for (i; i <= f; i++) {
    schedule.push(i < 10 ? `0${i}:00` : `${i}:00`);
  }

  // MONTA OS OBJETOS COM OS HORÁRIOS E DISPONIBILIDADE
  const available = schedule.map((time) => {
    const [h, m] = time.split(':');
    // COMPARAR COM HORA ATUAL
    const value = date.setHours(Number(h), Number(m));

    // COMPARAR COM APPOINTMENTS
    return {
      time,
      value: format(value, "yyyy-MM-dd'T'HH:mm:ssxxx"),
      available:
        isAfter(value, new Date()) &&
        !appointments.find((a) => format(a.hour, 'HH:mm') === time),
    };
  });

  res.status(200).json({
    status: 'success',
    data: available,
  });
});
