const dotenv = require('dotenv');

// SE TIVER NO AMBIENTE DE TESTES PEGA O .ENV SEPARADO
dotenv.config({ path: process.env.NODE_ENV === 'test' ? '.env.test' : '.env' });
