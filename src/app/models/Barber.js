const { Model, DataTypes } = require('sequelize');

class Barber extends Model {
  // RECEBE A CONNECTION
  static init(sequelize) {
    super.init(
      {
        hour_start: {
          type: DataTypes.TIME,
          allowNull: false,
          validate: {
            notNull: {
              msg: 'A hora inicial deve ser informada',
            },
          },
        },
        hour_finish: {
          type: DataTypes.TIME,
          allowNull: false,
          validate: {
            notNull: {
              msg: 'A hora final deve ser informada',
            },
          },
        },
        avatar: DataTypes.STRING,
        avatar_url: {
          type: DataTypes.VIRTUAL,
          get() {
            return this.getDataValue('avatar')
              ? `${process.env.HOST_ADDRESS}/public/images/${this.getDataValue(
                  'avatar'
                )}`
              : null;
          },
        },
        user_id: {
          type: DataTypes.INTEGER,
          unique: {
            args: true,
            msg: 'O usuário já é um barbeiro',
          },
        },
      },
      {
        sequelize,
        underscored: true,
        defaultScope: {
          where: {
            isActive: true,
          },
          attributes: {
            exclude: ['createdAt', 'updatedAt', 'company_id'],
          },
        },
      }
    );
    return this;
  }

  static associate(models) {
    this.belongsTo(models.Company, { foreignKey: 'company_id', as: 'company' });
    this.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
    this.belongsToMany(models.Service, {
      foreignKey: 'barber_id',
      through: 'barber_service',
      as: 'services',
    });
    this.hasMany(models.Appointment, {
      foreignKey: 'barber_id',
      as: 'appointments',
    });
  }
}

module.exports = Barber;
