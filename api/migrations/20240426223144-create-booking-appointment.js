'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('BookingAppointments', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      patient_name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      phone_number: {
        type: Sequelize.STRING,
        allowNull: false
      },
      email: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      gender: {
        type: Sequelize.STRING,
        allowNull: false
      },
      hospital_name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      consulting: {
        type: Sequelize.STRING,
        allowNull: false
      },
      services: {
        type: Sequelize.STRING,
        allowNull: false
      },
      appointment_date: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      appointment_time: {
        type: Sequelize.TIME,
        allowNull: false
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE
      },
      deleted_at: {
        allowNull: true,
        type: Sequelize.DATE
      },
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('BookingAppointments');
  }
};
