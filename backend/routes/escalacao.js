const express = require('express');
const jwt = require('jsonwebtoken');
const Escalacao = require('../models/escalacao');
const Jogador = require('../models/jogador');
const Usuario = require('../models/usuario');
const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'cartola_secret_key_123';

// Middleware de Autenticação
const authMiddleware = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) return res.status(401).json({ error: 'Não autorizado' });
        const decoded = jwt.verify(token, JWT_SECRET);
        req.userId = decoded.id;
        next();
    } catch (error) {
        res.status(401).json({ error: 'Token inválido' });
    }
};

// Obter escalação atual
router.get('/', authMiddleware, async (req, res) => {
    try {
        const escalacao = await Escalacao.findAll({
            where: { usuarioId: req.userId },
            include: [{ model: Jogador }]
        });
        res.json(escalacao.map(e => e.jogador));
    } catch (error) {
        res.status(500).json({ error: 'Erro ao buscar escalação' });
    }
});

// Escalar jogador (Comprar)
router.post('/comprar', authMiddleware, async (req, res) => {
    try {
        const { jogadorId } = req.body;
        const usuario = await Usuario.findByPk(req.userId);
        const jogador = await Jogador.findByPk(jogadorId);

        if (!jogador) return res.status(404).json({ error: 'Jogador não encontrado' });

        // Verificar se já está escalado
        const jaEscalado = await Escalacao.findOne({ where: { usuarioId: req.userId, jogadorId } });
        if (jaEscalado) return res.status(400).json({ error: 'Jogador já está no seu time' });

        // Verificar saldo
        if (usuario.saldo < jogador.preco) {
            return res.status(400).json({ error: 'Saldo insuficiente' });
        }

        // Limite de escalação (ex: 11 jogadores)
        const totalEscalados = await Escalacao.count({ where: { usuarioId: req.userId } });
        if (totalEscalados >= 11) {
            return res.status(400).json({ error: 'Seu time já está completo (limite de 11 jogadores)' });
        }

        // Executar compra
        await Escalacao.create({ usuarioId: req.userId, jogadorId });
        usuario.saldo -= jogador.preco;
        await usuario.save();

        res.json({ message: 'Jogador escalado com sucesso', novoSaldo: usuario.saldo });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao escalar jogador' });
    }
});

// Remover jogador (Vender)
router.post('/vender', authMiddleware, async (req, res) => {
    try {
        const { jogadorId } = req.body;
        const usuario = await Usuario.findByPk(req.userId);
        const jogador = await Jogador.findByPk(jogadorId);

        const escalacao = await Escalacao.findOne({ where: { usuarioId: req.userId, jogadorId } });
        if (!escalacao) return res.status(404).json({ error: 'Jogador não está na sua escalação' });

        await escalacao.destroy();
        usuario.saldo += jogador.preco;
        await usuario.save();

        res.json({ message: 'Jogador removido com sucesso', novoSaldo: usuario.saldo });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao remover jogador' });
    }
});

module.exports = router;
