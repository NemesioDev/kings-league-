const {Sequelize} = require('sequelize');
const path = require('path');

const sequelize = new Sequelize ({
    dialect: 'sqlite',
    storage: path.join(process.cwd(), 'cartola_database.sqlite'),
    logging: false
})
module.exports = sequelize;