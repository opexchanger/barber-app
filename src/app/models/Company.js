const { Model, DataTypes, Op } = require('sequelize');

class Company extends Model {
  // RECEBE A CONNECTION
  static init(sequelize) {
    super.init(
      {
        name: {
          type: DataTypes.STRING,
          allowNull: false,
          validate: {
            notNull: {
              msg: 'A empresa tem que ter um nome',
            },
          },
        },
        phone_number: {
          type: DataTypes.STRING,
          validate: {
            is: {
              args: [
                /^(?:(?:\+|00)?(55)\s?)?(?:\(?([1-9][0-9])\)?\s?)?(?:((?:9\d|[2-9])\d{3})-?(\d{4}))$/,
              ],
              msg: 'O telefone não está em um padrão aceito',
            },
          },
        },
        phone_number_secondary: {
          type: DataTypes.STRING,
          validate: {
            is: {
              args: [
                /^(?:(?:\+|00)?(55)\s?)?(?:\(?([1-9][0-9])\)?\s?)?(?:((?:9\d|[2-9])\d{3})-?(\d{4}))$/,
              ],
              msg: 'O segundo telefone não está em um padrão aceito',
            },
          },
        },
        bio: DataTypes.STRING,
        email: DataTypes.STRING,
        address: DataTypes.STRING,
        deleted_at: DataTypes.DATE,
      },
      {
        sequelize,
        underscored: true,
        defaultScope: {
          where: {
            deleted_at: {
              [Op.eq]: null,
            },
          },
          attributes: {
            exclude: ['created_at', 'updated_at'],
          },
        },
      }
    );
    return this;
  }
}

module.exports = Company;
