const { Model, DataTypes } = require('sequelize');

class Service extends Model {
  static init(sequelize) {
    super.init(
      {
        name: {
          type: DataTypes.STRING,
          allowNull: false,
          validate: {
            notNull: {
              msg: 'O nome é obrigatório',
            },
            len: {
              args: [2],
              msg: 'O nome deve ter pelo menos 2 caracteres',
            },
          },
          unique: {
            args: true,
            msg: 'Já existe um serviço com este nome',
          },
        },
        icon: DataTypes.STRING,
        icon_url: {
          type: DataTypes.VIRTUAL,
          get() {
            return this.getDataValue('icon')
              ? `http://localhost:3000/public/images/${this.getDataValue(
                  'icon'
                )}`
              : null;
          },
        },
      },
      {
        sequelize,
        defaultScope: {
          where: {
            isActive: true,
          },
          attributes: {
            exclude: ['created_at', 'updated_at', 'company_id'],
          },
        },
      }
    );
    return this;
  }

  static associate(models) {
    this.belongsTo(models.Company, { foreignKey: 'company_id', as: 'company' });
    this.belongsToMany(models.Barber, {
      foreignKey: 'service_id',
      through: 'barber_service',
      as: 'barbers',
    });
    this.hasMany(models.Appointment, {
      foreignKey: 'service_id',
      as: 'appointments',
    });
  }
}

module.exports = Service;
