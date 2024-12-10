const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

class Profile extends Model {
  static init(sequelize) {
    return super.init({
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id'
        }
      },
      companyName: {
        type: DataTypes.STRING,
        allowNull: false
      },
      description: {
        type: DataTypes.TEXT
      },
      address: {
        type: DataTypes.STRING
      },
      city: {
        type: DataTypes.STRING
      },
      country: {
        type: DataTypes.STRING
      },
      phone: {
        type: DataTypes.STRING
      },
      website: {
        type: DataTypes.STRING
      },
      profileImage: {
        type: DataTypes.STRING
      },
      categories: {
        type: DataTypes.JSON,
        defaultValue: []
      },
      languages: {
        type: DataTypes.JSON,
        defaultValue: ['en']
      },
      businessHours: {
        type: DataTypes.JSON,
        defaultValue: {}
      },
      services: {
        type: DataTypes.JSON
      },
      rating: {
        type: DataTypes.FLOAT,
        defaultValue: 0
      },
      reviewCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0
      }
    }, {
      sequelize,
      modelName: 'Profile'
    });
  }

  static associate(models) {
    this.belongsTo(models.User);
  }
}

Profile.init(sequelize);

module.exports = Profile;
