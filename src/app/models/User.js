const { Model, DataTypes, Op } = require('sequelize');
const bcrypt = require('bcryptjs');

class User extends Model {
  // RECEBE A CONNECTION
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
        },
        email: {
          type: DataTypes.STRING,
          allowNull: false,
          validate: {
            notNull: {
              msg: 'O email é obrigatório',
            },
            isEmail: {
              msg: 'O formato do e-mail não é valido',
            },
          },
          unique: {
            args: true,
            msg: 'O email já está cadastrado',
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
        password: {
          type: DataTypes.VIRTUAL,
          allowNull: false,
          validate: {
            notNull: {
              msg: 'Senha é obrigatório',
            },
          },
        },
        confirm_password: {
          type: DataTypes.VIRTUAL,
          allowNull: false,
          validate: {
            notNull: {
              msg: 'Confirmação da senha é obrigatório',
            },
            passwordMatch(val) {
              if (val !== this.password)
                throw new Error('As senhas não são iguais');
            },
          },
        },
        role: {
          type: DataTypes.ENUM('client', 'barber'),
          defaultValue: 'client',
          validate: {
            isIn: {
              args: [['client', 'barber']],
              msg: 'Nome da função inválida, deve ser client ou barber',
            },
          },
        },
        password_hash: DataTypes.STRING,
        admin: DataTypes.BOOLEAN,
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
            exclude: [
              'password_hash',
              'admin',
              'company_id',
              'createdAt',
              'updatedAt', // BUG o sequelize monta os campo camelCase mesmo q ta tudo underscored: true
              'deleted_at',
            ],
          },
        },
      }
    );

    this.addHook('beforeSave', async function (user) {
      if (user.password) {
        user.password_hash = await bcrypt.hash(user.password, 8);
      }
    });

    this.addHook('afterSave', async function (user) {
      user.password = undefined;
      user.confirm_password = undefined;
    });

    return this;
  }

  static associate(models) {
    this.belongsTo(models.Company, { foreignKey: 'company_id', as: 'company' });
    this.hasOne(models.Barber, { foreignKey: 'user_id', as: 'barber' });
    this.hasMany(models.Appointment, {
      foreignKey: 'user_id',
      as: 'appointments',
    });
  }

  async comparePasswords(candidate) {
    try {
      return await bcrypt.compare(candidate, this.password_hash);
    } catch (err) {
      throw new Error(err.message);
    }
  }
}

module.exports = User;
