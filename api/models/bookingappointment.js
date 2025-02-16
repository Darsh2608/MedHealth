'use strict';

module.exports = (sequelize, DataTypes) => {
  const BookingAppointments = sequelize.define('BookingAppointments', {
    id: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: DataTypes.INTEGER
    },
    patient_name: {
      type: DataTypes.STRING(150),
      allowNull: false
    },
    phone_number: {
      type: DataTypes.STRING(20),
      allowNull: false
    },
    email: {
      type: DataTypes.STRING(191),
      allowNull: false,
      validate: {
        isEmail: {
          msg: 'Invalid email address'
        }
      }
    },
    gender: {
      type: DataTypes.ENUM('Male', 'Female', 'Other'),
      allowNull: false
    },
    hospital_name: {
      type: DataTypes.STRING(191),
      allowNull: false
    },
    consulting: {
      type: DataTypes.STRING(150),
      allowNull: false
    },
    services: {
      type: DataTypes.STRING(150),
      allowNull: false
    },
    appointment_date: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    appointment_time: {
      type: DataTypes.TIME,
      allowNull: false
    },
    created_at: {
      field: 'created_at',
      type: DataTypes.DATE,
      allowNull: false
    },
    updated_at: {
      field: 'updated_at',
      type: DataTypes.DATE
    },
    deleted_at: {
      field: 'deleted_at',
      type: DataTypes.DATE
    }
  }, {
    freezeTableName: true,
    tableName: 'BookingAppointments',
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at',
    timestamps: true,
    paranoid: true
  });

  return BookingAppointments;
};
