import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import mongoose from 'mongoose';
import session from 'express-session';
import passport from 'passport'; // Certifique-se de importar o passport
import './config/passport.js'; // Importa o arquivo de configuração do passport
import { MercadoPagoConfig, Payment } from 'mercadopago'; // Importando Mercado Pago

dotenv.config();

const app = express();
import User from './models/User.js';

// Inicialize o objeto cliente do Mercado Pago
const client = new MercadoPagoConfig({
    accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN, // Use variáveis de ambiente para o token
    options: { timeout: 5000, idempotencyKey: 'unique-key' }
});

// Inicialize o objeto Payment
const payment = new Payment(client);

// Configuração do Mongoose
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('Conectado ao MongoDB'))
    .catch(err => console.error('Erro ao conectar ao MongoDB:', err));

// Configuração do Express
app.use(cors({
    origin: 'http://localhost:3000', // Permitir o frontend acessar o backend
    credentials: true
}));

app.use(session({
    secret: '@88Ab15cd98Ef12', // Substitua por uma chave secreta segura
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());
app.use(express.json());

// Rota de teste
app.get('/', (req, res) => {
    res.send('Servidor Backend está funcionando!');
});

// Rotas de autenticação
app.get('/auth/google', passport.authenticate('google', {
    scope: ['profile', 'email']
}));

app.get('/auth/google/callback', passport.authenticate('google'), (req, res) => {
    res.redirect('http://localhost:3000/dashboard');
});

// Rota de logout
app.get('/logout', (req, res) => {
    req.logout();
    res.redirect('/');
});

// Rota para obter o usuário logado
app.get('/api/current_user', (req, res) => {
    if (req.user) {
        res.json(req.user); // Retorne os dados do usuário como JSON
    } else {
        res.status(401).json({ error: "Usuário não autenticado" });
    }
});

// Rota para criar um pagamento com PIX
app.post('/api/pagamento/pix', async (req, res) => {
    try {
        const { valor, email, nome, descricao } = req.body;

        console.log('Dados recebidos do front-end:');
        console.log('valor:', valor);
        console.log('email:', email);
        console.log('nome:', nome);
        console.log('descricao:', descricao);

        // Validação simples de e-mail
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ error: 'E-mail inválido' });
        }

        // Objeto de pagamento
        const body = {
            transaction_amount: parseFloat(valor),
            description: descricao,
            payment_method_id: 'pix', // Especifique o método de pagamento
            payer: {
                email: email
            }
        };

        // Efetua o pagamento
        const response = await payment.create({ body });
        console.log('Resposta do Mercado Pago:', response);

        // Envie a resposta para o frontend
        res.status(200).json({ message: 'Pagamento criado com sucesso', response });
    } catch (error) {
        console.error('Erro ao criar pagamento:', error);
        res.status(500).json({ error: error.message });
    }
});

// Webhook para receber notificações do Mercado Pago
app.post('/api/webhook', async (req, res) => {
    try {
        const payment = req.body;
        console.log('Webhook recebido:', payment);

        // Verifique se os dados do pagamento estão presentes
        if (payment && payment.type === 'payment' && payment.data && payment.data.id) {
            const paymentId = payment.data.id;

            // Chame a API do Mercado Pago para obter detalhes do pagamento
            const paymentDetails = await mercadopago.payment.get(paymentId);
            const paymentStatus = paymentDetails.body.status;
            const paymentDescription = paymentDetails.body.description;

            // Atualize o status do pagamento no banco de dados
            await Payment.findOneAndUpdate(
                { paymentId: paymentId }, // Procura pelo ID do pagamento
                { status: paymentStatus, description: paymentDescription }, // Atualiza o status e a descrição
                { upsert: true, new: true } // Cria um novo documento se não existir
            );

            console.log(`Status do pagamento atualizado: ${paymentStatus}`);

            res.status(200).send('Webhook recebido com sucesso');
        } else {
            res.status(400).send('Dados de pagamento inválidos');
        }
    } catch (error) {
        console.error('Erro ao processar o webhook:', error);
        res.status(500).send('Erro ao processar o webhook');
    }
});

// Rota para verificar o status do pagamento
app.get('/api/pagamento/status/:id', async (req, res) => {
    try {
        const paymentId = req.params.id;

        // Use a API do Mercado Pago para obter detalhes do pagamento
        const payment = await mercadopago.payment.findById(paymentId);

        if (payment && payment.status) {
            res.status(200).json({ status: payment.status });
        } else {
            res.status(404).json({ error: 'Pagamento não encontrado' });
        }
    } catch (error) {
        console.error('Erro ao verificar o status do pagamento:', error);
        res.status(500).json({ error: 'Erro ao verificar o status do pagamento' });
    }
});


// Inicia o servidor
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
