const Sequelize = require('sequelize');

const dbConfig = require('../config/database');
const Company = require('../app/models/Company');
const User = require('../app/models/User');
const Barber = require('../app/models/Barber');
const Service = require('../app/models/Service');
const BarberService = require('../app/models/Barber_Service');
const Appointment = require('../app/models/Appointment');

const sequelize = new Sequelize(dbConfig);

sequelize
  .authenticate()
  .then(() => {
    console.log('Database connected.');
  })
  .catch((error) => {
    console.error('Unable to connect to the database:', error);
  });

const models = [Company, User, Barber, Service, BarberService, Appointment];

// INSTANCIANDO AS CLASSES-MODEL PASSANDO A CONNECTION
models
  .map((model) => model.init(sequelize))
  .map((model) => model.associate && model.associate(sequelize.models));

module.exports = sequelize;
