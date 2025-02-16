'use strict';
const bcrypt = require('bcryptjs');

module.exports = (sequelize, DataTypes) => {
  const Users = sequelize.define('Users', {
    id: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: DataTypes.INTEGER
    },
    name: {
      type: DataTypes.STRING(150),
      required: true,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING(191),
      allowNull: true,
      validate: {
        isEmail: {
          msg: 'Invalid email address'
        }
      }
    },
    password: {
      type: DataTypes.STRING(191),
      required: false,
      allowNull: true,
    },
    type: {
      type: DataTypes.TINYINT(1), // 0 = Superadmin, 1 = DoctorAdmin and 2 = users
      defaultValue: 2
    },
    created_at: {
      field: "created_at",
      type: DataTypes.DATE,
      allowNull: false
    },
    updated_at: {
      field: "updated_at",
      type: DataTypes.DATE
    },
    deleted_at: {
      field: "deleted_at",
      type: DataTypes.DATE
    }
  }, {
    freezeTableName: true,
    tableName: "users",
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at',
    timestamps: true,
    paranoid: true
  });

  
  // Additional methods and queries...

  return Users;
}


