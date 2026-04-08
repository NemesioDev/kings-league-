const { DataTypes } = require('sequelize');
const db = require('../config/database');

const Usuario = db.define('usuario', {
    nome: {
        type: DataTypes.STRING,
        allowNull: false
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    senha: {
        type: DataTypes.STRING,
        allowNull: false
    },
    saldo: {
        type: DataTypes.FLOAT,
        defaultValue: 100.0
    },
    pontuacaoTotal: {
        type: DataTypes.FLOAT,
        defaultValue: 0.0
    },
    role: {
        type: DataTypes.STRING,
        defaultValue: 'user'
    }
});

module.exports = Usuario;
