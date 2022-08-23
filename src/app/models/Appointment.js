const { Model, DataTypes } = require('sequelize');

class Appointment extends Model {
  static init(sequelize) {
    super.init(
      {
        hour: {
          type: DataTypes.DATE,
          allowNull: false,
          validate: {
            notNull: {
              msg: 'A data é obrigatória',
            },
          },
        },
        status: {
          type: DataTypes.ENUM('pendente', 'cancelado', 'concluido', 'ocupado'),
          defaultValue: 'pendente',
        },
        price: DataTypes.DECIMAL(5, 2),
        duration: DataTypes.TIME,
      },
      {
        sequelize,
        defaultScope: {
          attributes: {
            exclude: ['createdAt', 'updatedAt'],
          },
        },
      }
    );
    return this;
  }

  static associate(models) {
    this.belongsTo(models.Company, { foreignKey: 'company_id', as: 'company' });
    this.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
    this.belongsTo(models.Barber, { foreignKey: 'barber_id', as: 'barber' });
    this.belongsTo(models.Service, { foreignKey: 'service_id', as: 'service' });
  }
}

module.exports = Appointment;
