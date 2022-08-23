const multer = require('multer');
const sharp = require('sharp');
const { resolve } = require('path');
const {
  parseISO,
  startOfDay,
  endOfDay,
  format,
  addHours,
  addMinutes,
  isAfter,
  isBefore,
  isFuture,
} = require('date-fns');
const { Op } = require('sequelize');

const multerConfig = require('../../config/multer');
const AppError = require('../../utils/appError');
const Barber = require('../models/Barber');
const Service = require('../models/Service');
const BarberService = require('../models/Barber_Service');
const { catchAsync } = require('../../utils/functions');

const upload = multer(multerConfig);

// vai criar o req.file se tiver uma imagem
exports.uploadBarberAvatar = upload.single('avatar');

exports.resizeBarberAvatar = (req, res, next) => {
  if (!req.file) return next();

  req.body.avatar = `barber-${req.params.id}-avatar.png`;

  sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat('png')
    .toFile(
      resolve(__dirname, '..', '..', '..', 'temp', 'images', req.body.avatar)
    );

  next();
};

exports.getMe = (req, res, next) => {
  if (!res.locals.barber)
    return next(
      new AppError('Seu cadastro de barbeiro ainda não está completo', 400)
    );

  req.params.id = res.locals.barber.id;
  next();
};

exports.validateService = catchAsync(async (req, res, next) => {
  // VERIFICA SE ID DO SERVIÇO INFORMADA É VÁLIDA
  if (!(await Service.findByPk(req.body.service_id)))
    return next(new AppError('Não há serviço com esta Id', 400));

  // VERIFICA SE BARBEIRO JÁ ESTÁ ASSOCIADO COM ESSE SERVIÇO
  if (
    await BarberService.findOne({
      where: {
        barber_id: req.params.id,
        service_id: req.body.service_id,
      },
    })
  )
    return next(new AppError('Você já possui este serviço', 400));

  // não achei outro lugar decente pra setar essa variavel
  req.body.barber_id = req.params.id;

  next();
});

const getBarberWorkingHoursArray = (barber, dayToBeChecked) => {
  let hourStart = Number(barber.hour_start.split(':')[0]);
  const hourFinish = Number(barber.hour_finish.split(':')[0]);
  const barberSchedule = [];

  for (hourStart; hourStart < hourFinish; hourStart++) {
    for (let minutes = 0; minutes <= 45; minutes += 15) {
      const hourAndMinutes = `${String(hourStart).padStart(2, '0')}:${String(
        minutes
      ).padStart(2, '0')}`; // Vai montar string tipo 08:00

      const hourAndMinutesWithDay = dayToBeChecked.setHours(hourStart, minutes);

      barberSchedule.push({
        time: hourAndMinutes,
        value: format(hourAndMinutesWithDay, "yyyy-MM-dd'T'HH:mm:ssxxx"), // Formato com fuso horário
        available: isFuture(hourAndMinutesWithDay),
      });
    }
  }
  return barberSchedule;
};

const formatSchedule = (schedule) => {
  const formatted = [];

  schedule.forEach((horario) => {
    const [hour, minute] = horario.time.split(':');
    if (minute === '00') {
      const hourObject = { IDHora: hour, horarios: [] };
      hourObject.horarios.push({
        ...horario,
        time: minute,
      });
      formatted.push(hourObject);
    }
  });

  schedule.forEach((horario) => {
    const [hour, minute] = horario.time.split(':');
    formatted.forEach((hourObject) => {
      if (hourObject.IDHora === hour && minute !== '00') {
        hourObject.horarios.push({
          ...horario,
          time: minute,
        });
      }
    });
  });

  return formatted;
};

// const getBarberWorkingHoursArray = (barber, dayToBeChecked) => {
//   let hourStart = Number(barber.hour_start.split(':')[0]);
//   const hourFinish = Number(barber.hour_finish.split(':')[0]);
//   const barberSchedule = [];

//   for (hourStart; hourStart < hourFinish; hourStart++) {
//     const hourObject = { IDHora: `${String(hourStart).padStart(2, '0')}` };
//     hourObject.horarios = [];

//     for (let minutes = 0; minutes <= 45; minutes += 15) {
//       // Vai juntar a hora com o dia
//       const hourAndMinutesWithDay = dayToBeChecked.setHours(hourStart, minutes);

//       hourObject.horarios.push({
//         minutes: `${String(minutes).padStart(2, '0')}`,
//         value: format(hourAndMinutesWithDay, "yyyy-MM-dd'T'HH:mm:ssxxx"), // Formato com fuso horário
//         available: isFuture(hourAndMinutesWithDay),
//       });
//     }
//     barberSchedule.push(hourObject);
//   }
//   return barberSchedule;
// };

const getAcrescedTime = (initialTime, duration) => {
  const [h, m] = duration.split(':');
  let finishingTime = addHours(initialTime, Number(h));
  finishingTime = addMinutes(finishingTime, Number(m));

  return finishingTime;
};

const removeBusyHoursFromSchedule = (schedule, appointments) => {
  appointments.forEach((a) => {
    const appointmentStartsAt = new Date(a.hour);
    const appointmentFinishesAt = getAcrescedTime(
      appointmentStartsAt,
      a.duration
    );

    schedule.forEach((time) => {
      const currentTimeInSchedule = parseISO(time.value);

      if (
        isAfter(currentTimeInSchedule, appointmentStartsAt) &&
        isBefore(currentTimeInSchedule, appointmentFinishesAt)
      ) {
        time.available = false;
      } else if (format(a.hour, 'HH:mm') === time.time) {
        time.available = false;
      }
    });
  });
  return schedule;
};

const getFittingTimeForService = (schedule, serviceDuration) => {
  schedule.forEach((time) => {
    if (time.available) {
      const serviceStartsAt = parseISO(time.value);
      const serviceWouldFinishAt = getAcrescedTime(
        serviceStartsAt,
        serviceDuration
      );
      // console.log(
      //   `now i'm at ${time.time} and would like disponibility until ${serviceWouldFinishAt}`
      // );

      const isThereATimeBlockingIt = schedule.find(
        (comparingTime) =>
          isAfter(parseISO(comparingTime.value), serviceStartsAt) &&
          isBefore(parseISO(comparingTime.value), serviceWouldFinishAt) &&
          !comparingTime.available
      );

      if (isThereATimeBlockingIt) time.available = false;
      // console.log('is there a time blocking it?');
      // console.log(isThereATimeBlockingIt);
      // if (isThereATimeBlockingIt)
      //   console.log('yea, therefore this value will be falsed');
      // console.log('----------------------------------------');
    }
  });
  return schedule;
};

exports.validateBarberScheduleRequest = async (req, res, next) => {
  const { date, serviceId } = req.query;

  if (!(date && serviceId))
    return next(new AppError('Informe dia e serviço', 400));

  const barber = await Barber.findByPk(req.params.id, {
    include: [
      {
        association: 'services',
        attributes: ['id'],
        through: {
          attributes: ['duration'],
        },
      },
    ],
  });

  if (!barber)
    return next(new AppError('Não há nenhum barbeiro com esta ID', 400));

  const barberHasService = barber
    .toJSON()
    .services.find((service) => service.id === Number(serviceId));

  if (!barberHasService)
    return next(
      new AppError('Este barbeiro não oferece o serviço solicitado', 400)
    );

  res.locals.barber = barber;
  res.locals.service = barberHasService.barber_service;
  res.locals.dayToBeChecked = parseISO(date);

  next();
};

/**
 * GET BARBER SCHEDULE
 */

exports.getBarberSchedule = catchAsync(async (req, res, next) => {
  const { barber, service, dayToBeChecked } = res.locals;

  let barberSchedule = getBarberWorkingHoursArray(barber, dayToBeChecked);

  const appointments = await barber.getAppointments({
    where: {
      status: 'pendente',
      hour: {
        [Op.between]: [startOfDay(dayToBeChecked), endOfDay(dayToBeChecked)],
      },
    },
    attributes: ['hour', 'duration'],
  });

  if (appointments.length > 0)
    barberSchedule = removeBusyHoursFromSchedule(barberSchedule, appointments);

  barberSchedule = getFittingTimeForService(barberSchedule, service.duration);

  const formattedSchedule = formatSchedule(barberSchedule);

  res.status(200).json({ status: 'success', data: formattedSchedule });
});
