const { DataTypes } = require('sequelize');
const db = require('../config/database');

const Escalacao = db.define('escalacao', {
    usuarioId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    jogadorId: {
        type: DataTypes.INTEGER,
        allowNull: false
    }
});

module.exports = Escalacao;
