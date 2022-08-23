exports.catchAsync = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch((err) => next(err));
  };
};

exports.filterObject = (obj, ...filters) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (filters.includes(el)) {
      newObj[el] = obj[el];
    }
  });
  return newObj;
};

// PRINTA TODOS MÉTODOS ESPECIAIS DO MODEL
// console.log('\nAssociations');
// for (let assoc of Object.keys(Barber.associations)) {
//   for (let accessor of Object.keys(Barber.associations[assoc].accessors)) {
//     console.log(
//       Barber.name +
//         '.' +
//         Barber.associations[assoc].accessors[accessor] +
//         '()'
//     );
//   }
// }
