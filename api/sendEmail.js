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

  // Логирование для проверки
  console.log('Запрос получен POST');
  console.log('Получены данные для отправки:', req.body);

  // Извлекаем поля
  const { toEmail, subject, body } = req.body;

  // Проверяем, что все обязательные поля переданы
  if (!toEmail || !subject || !body) {
    console.log('Ошибка: Не все обязательные поля предоставлены');
    return res.status(400).json({ error: 'Все поля обязательны' });
  }

  // Структура данных для отправки
  const data = {
    FromEmailAddress: 'no-reply@packmaster.tech',
    Destination: {
      ToAddresses: Array.isArray(toEmail) ? toEmail : [toEmail]  // Обеспечиваем, что это всегда массив
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

  console.log('Данные для отправки в API:', data);

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

    console.log('Ответ от API:', response.data);
    return res.status(200).json({ message: 'Письмо отправлено', data: response.data });
  } catch (error) {
    console.error('Ошибка при отправке письма:', error);
    return res.status(500).json({ error: 'Ошибка при отправке письма', details: error.message });
  }
};
