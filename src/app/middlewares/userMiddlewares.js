const { filterObject } = require('../../utils/functions');

exports.filterInsertInput = (req, res, next) => {
  req.body = filterObject(
    req.body,
    'company_id',
    'name',
    'email',
    'phone_number',
    'phone_number_secondary',
    'password',
    'confirm_password'
  );

  next();
};

exports.filterUpdateInput = (req, res, next) => {
  req.body = filterObject(
    req.body,
    'name',
    'email',
    'phone_number',
    'phone_number_secondary'
  );

  next();
};

exports.getMe = (req, res, next) => {
  req.params.id = res.locals.user.id;
  next();
};

exports.getId = (req, res, next) => {
  req.body.user_id = res.locals.user.id;
  next();
};

exports.onlyBarbers = (req, res, next) => {
  req.query.role = 'barber';
  next();
};
