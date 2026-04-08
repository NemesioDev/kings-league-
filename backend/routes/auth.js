const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Usuario = require('../models/usuario');
const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'cartola_secret_key_123';

// Registro
router.post('/register', async (req, res) => {
    console.log('Recebida requisição de registro:', JSON.stringify(req.body));
    try {
        const { nome, email, senha } = req.body;
        
        if (!nome || !email || !senha) {
            console.log('Dados incompletos para registro:', { nome: !!nome, email: !!email, senha: !!senha });
            return res.status(400).json({ error: 'Preencha todos os campos' });
        }

        const existingUser = await Usuario.findOne({ where: { email } });
        if (existingUser) {
            console.log('Email já cadastrado:', email);
            return res.status(400).json({ error: 'Email já cadastrado' });
        }

        console.log('Criando usuário no banco de dados...');
        const hashedSenha = await bcrypt.hash(senha, 10);
        
        // Atribuir papel de admin para o email específico
        const role = email === 'nemesioangelooliveiradasilva@gmail.com' ? 'admin' : 'user';

        const usuario = await Usuario.create({
            nome,
            email,
            senha: hashedSenha,
            saldo: 100.0,
            pontuacaoTotal: 0.0,
            role
        });

        console.log('Usuário registrado com sucesso ID:', usuario.id, 'Role:', role);
        const token = jwt.sign({ id: usuario.id }, JWT_SECRET, { expiresIn: '24h' });
        res.json({ token, usuario: { id: usuario.id, nome: usuario.nome, email: usuario.email, saldo: usuario.saldo, pontuacaoTotal: usuario.pontuacaoTotal, role: usuario.role } });
    } catch (error) {
        console.error('Erro detalhado no registro:', error);
        res.status(500).json({ error: 'Erro ao registrar usuário: ' + error.message });
    }
});

// Login
router.post('/login', async (req, res) => {
    console.log('Recebida requisição de login:', req.body.email);
    try {
        const { email, senha } = req.body;
        const usuario = await Usuario.findOne({ where: { email } });
        
        if (!usuario || !(await bcrypt.compare(senha, usuario.senha))) {
            console.log('Credenciais inválidas para:', email);
            return res.status(401).json({ error: 'Credenciais inválidas' });
        }

        console.log('Login bem-sucedido para:', email);
        const token = jwt.sign({ id: usuario.id }, JWT_SECRET, { expiresIn: '24h' });
        res.json({ token, usuario: { id: usuario.id, nome: usuario.nome, email: usuario.email, saldo: usuario.saldo, role: usuario.role } });
    } catch (error) {
        console.error('Erro no login:', error);
        res.status(500).json({ error: 'Erro ao fazer login: ' + error.message });
    }
});

// Me (Verificar token e retornar usuário)
router.get('/me', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) return res.status(401).json({ error: 'Não autorizado' });

        const decoded = jwt.verify(token, JWT_SECRET);
        const usuario = await Usuario.findByPk(decoded.id, {
            attributes: ['id', 'nome', 'email', 'saldo', 'pontuacaoTotal', 'role']
        });

        if (!usuario) return res.status(404).json({ error: 'Usuário não encontrado' });
        res.json(usuario);
    } catch (error) {
        res.status(401).json({ error: 'Token inválido' });
    }
});

module.exports = router;
