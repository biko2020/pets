const sequelize = require('./src/config/database');
const User = require('./src/models/User');
const Profile = require('./src/models/Profile');
const Category = require('./src/models/Category');
// Import other models...

const syncDatabase = async () => {
  try {
    await sequelize.sync({ force: true }); // Use { alter: true } for safer migrations
    console.log('Database synchronized successfully');
  } catch (error) {
    console.error('Error synchronizing database:', error);
  }
};

syncDatabase();