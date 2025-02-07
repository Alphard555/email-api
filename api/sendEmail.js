// api/sendEmail.js

const axios = require('axios');
const aws4 = require('aws4');

const AWS_KEY_ID = process.env.AWS_KEY_ID;  // Переменные окружения
const AWS_SECRET_KEY = process.env.AWS_SECRET_KEY;
const REGION = 'ru-central1';
const SERVICE = 'ses';

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Метод не поддерживается' });
  }

  const { toEmail, subject, body } = req.body;

  if (!toEmail || !subject || !body) {
    return res.status(400).json({ error: 'Все поля обязательны' });
  }

  const data = {
    FromEmailAddress: 'no-reply@packmaster.tech',
    Destination: {
      ToAddresses: [toEmail]
    },
    Content: {
      Simple: {
        Subject: {
          Data: subject,
          Charset: 'UTF-8'
        },
        Body: {
          Text: {
            Data: body,
            Charset: 'UTF-8'
          }
        }
      }
    }
  };

  const endpoint = 'https://postbox.cloud.yandex.net/v2/email/outbound-emails';

  // Создаем запрос с AWS Signature V4
  const opts = {
    host: 'postbox.cloud.yandex.net',
    path: '/v2/email/outbound-emails',
    service: 'ses',
    region: 'ru-central1',
    method: 'POST',
    body: JSON.stringify(data),
    headers: { 'Content-Type': 'application/json' }
  };

  // Подписываем запрос
  aws4.sign(opts, {
    accessKeyId: AWS_KEY_ID,
    secretAccessKey: AWS_SECRET_KEY,
  });

  try {
    const response = await axios({
      method: opts.method,
      url: endpoint,
      headers: opts.headers,
      data: opts.body,
    });

    return res.status(200).json({ message: 'Письмо отправлено', data: response.data });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Ошибка при отправке письма', details: error.message });
  }
};
