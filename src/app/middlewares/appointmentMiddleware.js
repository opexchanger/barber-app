const {
  isBefore,
  startOfHour,
  parseISO,
  format,
  setSeconds,
} = require('date-fns');

const BarberService = require('../models/Barber_Service');
const Barber = require('../models/Barber');
const Appointment = require('../models/Appointment');
const AppError = require('../../utils/appError');
const { filterObject, catchAsync } = require('../../utils/functions');

exports.filterInput = (req, res, next) => {
  req.body = filterObject(req.body, 'service_id', 'barber_id', 'hour');

  next();
};

/**
 * GET PRICE OF SERVICE
 */
exports.getServiceData = catchAsync(async (req, res, next) => {
  const BS = await BarberService.findOne({
    where: { barber_id: req.body.barber_id, service_id: req.body.service_id },
  });
  if (!BS)
    return next(
      new AppError('Este barbeiro não oferece o serviço solicitado', 400)
    );
  req.body.price = BS.price;
  req.body.duration = BS.duration;

  next();
});

/**
 * GET USER APPOINTING
 */
exports.getUser = catchAsync(async (req, res, next) => {
  // PEGA APENAS HORAS CHEIAS
  const hour = startOfHour(parseISO(req.body.hour));

  // VERIFICA SE O USUÁRIO TEM AGENDAMENTO NESSE HORÁRIO
  const hourTaken = await Appointment.findOne({
    where: { user_id: res.locals.user.id, status: 'pendente', hour },
  });

  if (hourTaken)
    return next(
      new AppError('Você já possui um agendamento neste horário', 401)
    );

  req.body.user_id = res.locals.user.id;
  req.body.company_id = res.locals.company;
  console.log(req.body);
  next();
});

/**
 * VALIDATE APPOINTMENT HOUR
 */
exports.validateHour = catchAsync(async (req, res, next) => {
  // TODO prevent this error: DatabaseError [SequelizeDatabaseError]: invalid input syntax for type timestamp with time zone: "Invalid date"
  // PEGA A HORA
  // HACK o front manda a data com uns segundos aleatorios
  const hour = setSeconds(parseISO(req.body.hour), '00');
  console.log(req.body.hour);

  // VERIFICA SE A HORA INFORMADA É ANTERIOR A DATA ATUAL
  if (isBefore(hour, Date.now()))
    return next(new AppError('Datas retroativas não são permitidas', 400));

  // VERIFICA E PEGA O BARBER SELECIONADO
  const barber = await Barber.findByPk(req.body.barber_id);
  if (!barber) return next(new AppError('Não há barbeiro com este ID', 400));

  // VERIFICA SE O BARBEIRO TEM AGENDAMENTO NESSE HORÁRIO
  // TODO VERIFCAR SE O BARBEIRO TRABALHA NESSE HORÁRIO RS
  const hourTaken = await Appointment.findOne({
    where: { barber_id: req.body.barber_id, status: 'pendente', hour },
  });

  if (hourTaken)
    return next(new AppError('Este horário não está disponível', 401));

  req.body.hour = format(hour, "yyyy-MM-dd'T'HH:mm:ssxxx");

  next();
});
