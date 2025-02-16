'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('users', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.DataTypes.INTEGER
      },
      name: {
        field: "name",
        type: Sequelize.DataTypes.STRING(150),
        required: true,
        allowNull: false,
      },
      email: {
        field: "email",
        type: Sequelize.DataTypes.STRING(191),
        allowNull: true,
        validate: {
          isEmail: {
            msg: 'Invalid email address'
          }
        }
      },
      password: {
        field: "password",
        type: Sequelize.DataTypes.STRING(191),
        required: false,
        allowNull: true,
      },
      type: {
        field: "type",
        type: Sequelize.DataTypes.TINYINT(1), // 0 = Superadmin, 1 = DoctorAdmin and 2 = users
        defaultValue: 2
      },
      created_at: {
        field: "created_at",
        type: Sequelize.DataTypes.DATE,
        allowNull: false
      },
      updated_at: {
        field: "updated_at",
        type: Sequelize.DataTypes.DATE
      },
      deleted_at: {
        field: "deleted_at",
        type: Sequelize.DataTypes.DATE
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('users');
  }
};