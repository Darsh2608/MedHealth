'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('HOSPITALS', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      hospital_name: {
        type: Sequelize.STRING
      },
      address_location: {
        type: Sequelize.STRING
      },
      services_provided: {
        type: Sequelize.STRING
      },
      doctor_name: {
        type: Sequelize.STRING
      },
      timing: {
        type: Sequelize.STRING
      },
      gender: {
        type: Sequelize.STRING
      },
      created_at: {
        type: Sequelize.DATE
      },
      updated_at: {
        type: Sequelize.DATE
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('HOSPITALS');
  }
};