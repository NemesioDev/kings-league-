const {DataTypes} = require('sequelize');
const db =  require('../config/database');

const Jogador = db.define('jogador', {
    nome:{
        type: DataTypes.STRING,
        allowNull: false
    },

    posicao:{
        type: DataTypes.STRING,
        allowNull: false
    },

    pontoGeral:{
        type: DataTypes.FLOAT,
        allowNull: false
    },

    preco:{
        type: DataTypes.FLOAT,
        allowNull: false
    },

    time:{
        type: DataTypes.STRING,
        allowNull: false
    }


});

module.exports = Jogador;