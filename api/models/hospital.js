'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Hospital extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  Hospital.init({
    hospital_name: DataTypes.STRING,
    address_location: DataTypes.STRING,
    services_provided: DataTypes.STRING,
    doctor_name: DataTypes.STRING,
    timing: DataTypes.STRING,
    gender: DataTypes.STRING,
    created_at: DataTypes.DATE,
    updated_at: DataTypes.DATE
  }, {
    sequelize,
    modelName: 'HOSPITALS',
  });


  // Authenticate user
Hospital.searchLocation = async (location) => {
  let query = `
    SELECT * FROM HOSPITALS
    WHERE 
      address_location LIKE :location OR
      hospital_name LIKE :location OR
      doctor_name LIKE :location
  `;

  return sequelize.query(query, {
    replacements: {
      location: `%${location}%`, // Add % wildcard for pattern matching
    },
    type: sequelize.QueryTypes.SELECT,
  });
}


  return Hospital;
};