const fs = require('fs');
const path = require('path');
const logStream = fs.createWriteStream(path.join(process.cwd(), 'server.log'), { flags: 'a' });

// Redirecionar console para o arquivo
const originalLog = console.log;
const originalError = console.error;

console.log = function(...args) {
    const time = new Date().toISOString();
    const msg = `[${time}] [LOG] ${args.map(a => typeof a === 'object' ? JSON.stringify(a) : a).join(' ')}\n`;
    logStream.write(msg);
    originalLog.apply(console, args);
};

console.error = function(...args) {
    const time = new Date().toISOString();
    const msg = `[${time}] [ERROR] ${args.map(a => typeof a === 'object' ? JSON.stringify(a) : a).join(' ')}\n`;
    logStream.write(msg);
    originalError.apply(console, args);
};

function log(msg) {
    console.log(msg);
}

log('Iniciando servidor Express...');
log('Current working directory: ' + process.cwd());
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const bcrypt = require('bcryptjs');
const db = require('../config/database');
const Jogador = require('../models/jogador');
const Usuario = require('../models/usuario');
const Escalacao = require('../models/escalacao');

// Associações
Usuario.hasMany(Escalacao, { foreignKey: 'usuarioId' });
Escalacao.belongsTo(Usuario, { foreignKey: 'usuarioId' });
Jogador.hasMany(Escalacao, { foreignKey: 'jogadorId' });
Escalacao.belongsTo(Jogador, { foreignKey: 'jogadorId' });

const app = express();
app.use(cors());
app.use(morgan('dev', { stream: logStream }));
app.use(express.json());

// Placeholder for Vite middleware
let viteMiddleware = (req, res, next) => {
    if (req.url.startsWith('/api')) return next();
    res.send('<html><body><h1>Iniciando o Cartola Kings League...</h1><script>setTimeout(() => window.location.reload(), 2000)</script></body></html>');
};

// Routes
const authRoutes = require('../routes/auth');
const escalacaoRoutes = require('../routes/escalacao');
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'cartola_secret_key_123';

// Middleware para verificar se o usuário é admin
const isAdmin = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) return res.status(401).json({ error: 'Não autorizado' });

        const decoded = jwt.verify(token, JWT_SECRET);
        const usuario = await Usuario.findByPk(decoded.id);

        if (!usuario || usuario.role !== 'admin') {
            return res.status(403).json({ error: 'Acesso negado. Apenas administradores.' });
        }

        req.usuario = usuario;
        next();
    } catch (error) {
        res.status(401).json({ error: 'Token inválido' });
    }
};

app.use('/api/auth', authRoutes);
app.use('/api/escalacao', escalacaoRoutes);

// Admin Routes
app.get('/api/admin/usuarios', isAdmin, async (req, res) => {
    try {
        const usuarios = await Usuario.findAll({
            attributes: ['id', 'nome', 'email', 'saldo', 'pontuacaoTotal', 'role']
        });
        res.json(usuarios);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao buscar usuários' });
    }
});

app.post('/api/admin/usuarios', isAdmin, async (req, res) => {
    try {
        const { nome, email, senha, role, saldo } = req.body;
        const hashedSenha = await bcrypt.hash(senha, 10);
        const usuario = await Usuario.create({
            nome,
            email,
            senha: hashedSenha,
            role: role || 'user',
            saldo: saldo || 100.0
        });
        res.json(usuario);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao criar usuário: ' + error.message });
    }
});

app.put('/api/admin/usuarios/:id', isAdmin, async (req, res) => {
    try {
        const { nome, email, role, saldo, pontuacaoTotal } = req.body;
        const usuario = await Usuario.findByPk(req.params.id);
        if (!usuario) return res.status(404).json({ error: 'Usuário não encontrado' });

        await usuario.update({ nome, email, role, saldo, pontuacaoTotal });
        res.json(usuario);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao atualizar usuário' });
    }
});

app.delete('/api/admin/usuarios/:id', isAdmin, async (req, res) => {
    try {
        const usuario = await Usuario.findByPk(req.params.id);
        if (!usuario) return res.status(404).json({ error: 'Usuário não encontrado' });
        
        if (usuario.id === req.usuario.id) {
            return res.status(400).json({ error: 'Você não pode deletar sua própria conta.' });
        }

        await usuario.destroy();
        res.json({ message: 'Usuário deletado com sucesso' });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao deletar usuário' });
    }
});

// API Jogadores
app.get('/api/jogadores', async (req, res) => {
    try {
        const jogadores = await Jogador.findAll();
        res.json(jogadores);
    } catch (error) {
        log('Erro ao buscar jogadores: ' + error.message);
        res.status(500).json({ error: 'Erro ao buscar jogadores' });
    }
});

app.get('/api/highlights', async (req, res) => {
    try {
        const highlights = await Jogador.findAll({
            order: [['pontoGeral', 'DESC']],
            limit: 3
        });
        res.json(highlights);
    } catch (error) {
        log('Erro ao buscar destaques: ' + error.message);
        res.status(500).json({ error: 'Erro ao buscar destaques' });
    }
});

app.post('/api/simulate-round', isAdmin, async (req, res) => {
    try {
        log('Iniciando simulação de rodada...');
        // 1. Randomly update points for all players
        const jogadores = await Jogador.findAll();
        for (const jogador of jogadores) {
            const randomPoints = (Math.random() * 15 - 2).toFixed(1); // Points between -2 and 13
            await jogador.update({ pontoGeral: parseFloat(randomPoints) });
        }

        // 2. Update user scores based on their lineups
        const usuarios = await Usuario.findAll();
        for (const usuario of usuarios) {
            const escalacao = await Escalacao.findAll({
                where: { usuarioId: usuario.id },
                include: [Jogador]
            });
            
            let roundPoints = 0;
            escalacao.forEach(item => {
                roundPoints += item.jogador.pontoGeral;
            });

            await usuario.update({ 
                pontuacaoTotal: usuario.pontuacaoTotal + roundPoints 
            });
        }

        log('Rodada simulada com sucesso!');
        res.json({ message: 'Rodada simulada com sucesso!' });
    } catch (error) {
        log('Erro ao simular rodada: ' + error.message);
        res.status(500).json({ error: 'Erro ao simular rodada' });
    }
});

app.post('/api/jogadores', isAdmin, async (req, res) => {
    try {
        const jogador = await Jogador.create(req.body);
        res.json(jogador);
    } catch (error) {
        log('Erro ao criar jogador: ' + error.message);
        res.status(500).json({ error: 'Erro ao criar jogador' });
    }
});

app.use((req, res, next) => {
    viteMiddleware(req, res, next);
});

// Vite Integration
async function setupVite() {
    log('Iniciando configuração do Vite...');
    if (process.env.NODE_ENV !== 'production') {
        try {
            const { createServer: createViteServer } = await import('vite');
            const vite = await createViteServer({
                server: { middlewareMode: true },
                appType: 'spa',
            });
            viteMiddleware = vite.middlewares;
            log('Vite middleware configurado com sucesso.');
        } catch (error) {
            log('Erro ao configurar middleware do Vite: ' + error.message);
            viteMiddleware = (req, res, next) => res.status(500).send('Erro ao carregar o frontend: ' + error.message);
        }
    } else {
        const distPath = path.join(process.cwd(), 'dist');
        app.use(express.static(distPath));
        viteMiddleware = (req, res, next) => {
            if (req.url.startsWith('/api')) return next();
            res.sendFile(path.join(distPath, 'index.html'));
        };
    }
}

async function startServer() {
    const server = app.listen(3000, '0.0.0.0', () => {
        log('Servidor do Cartola rodando na porta 3000');
    });

    // Start Vite setup in background
    setupVite();

    server.on('error', (err) => {
        log('Erro no servidor Express: ' + err.message);
    });

    try {
        log('Sincronizando banco de dados...');
        await db.sync({ alter: true });
        log('Conexão com o banco de dados estabelecida com sucesso.');
        
        // Seed data if empty
        const count = await Jogador.count();
        if (count === 0) {
            await Jogador.bulkCreate([
                { nome: 'Neymar Jr', posicao: 'ATA', pontoGeral: 0, preco: 20.0, time: 'Santos' },
                { nome: 'Arrascaeta', posicao: 'MEI', pontoGeral: 0, preco: 15.0, time: 'Flamengo' },
                { nome: 'Gustavo Gomez', posicao: 'ZAG', pontoGeral: 0, preco: 12.0, time: 'Palmeiras' },
                { nome: 'Weverton', posicao: 'GOL', pontoGeral: 0, preco: 10.0, time: 'Palmeiras' },
            ]);
            log('Dados iniciais inseridos.');
        }

        // Garantir que o usuário específico seja admin e resetar senha se necessário
        let adminUser = await Usuario.findOne({ where: { email: 'nemesioangelooliveiradasilva@gmail.com' } });
        const hashedSenha = await bcrypt.hash('admin123', 10);
        
        if (adminUser) {
            await adminUser.update({ 
                role: 'admin',
                senha: hashedSenha 
            });
            log('Senha e papel de admin resetados para o usuário mestre.');
        } else {
            await Usuario.create({
                nome: 'Admin Master',
                email: 'nemesioangelooliveiradasilva@gmail.com',
                senha: hashedSenha,
                role: 'admin',
                saldo: 1000.0,
                pontuacaoTotal: 0.0
            });
            log('Usuário mestre criado com sucesso.');
        }
    } catch (error) {
        log('Erro durante a inicialização do banco de dados: ' + error.message);
    }
}

startServer();
