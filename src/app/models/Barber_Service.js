const { Model, DataTypes } = require('sequelize');

class BarberService extends Model {
  // RECEBE A CONNECTION
  static init(sequelize) {
    super.init(
      {
        price: {
          type: DataTypes.DECIMAL(5, 2),
          allowNull: false,
          validate: {
            notNull: {
              msg: 'O preço deve ser informado',
            },
          },
        },
        duration: {
          type: DataTypes.TIME,
          allowNull: false,
          validate: {
            notNull: {
              msg: 'A duração do atendimento deve ser informada',
            },
          },
        },
      },
      {
        sequelize,
        tableName: 'barber_service',
      }
    );
    return this;
  }

  static associate(models) {
    this.belongsTo(models.Barber, { foreignKey: 'barber_id', as: 'barber' });
    this.belongsTo(models.Service, { foreignKey: 'service_id', as: 'service' });
  }
}

module.exports = BarberService;
