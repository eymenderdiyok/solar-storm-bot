import fetch from 'node-fetch';

const token = process.env.TELEGRAM_TOKEN;
const chatId = process.env.CHAT_ID;
const TELEGRAM_API = `https://api.telegram.org/bot${token}`;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }

  const body = req.body;

  if (!body.message || !body.message.text) {
    return res.status(200).send('No message');
  }

  const chat_id = body.message.chat.id;
  const text = body.message.text.trim().toLowerCase();

  // Basit komut işleme
  if (text === '/start') {
    await sendMessage(chat_id, 'Merhaba! Güneş Fırtınası Takip Botuna hoş geldin. /help yazarak komutları görebilirsin.');
  } else if (text === '/help') {
    const helpMsg = `
Komutlar:
/status - Anlık genel durum
/kp - Son 3 saatlik Kp endeksi
/aurora - Güncel aurora haritası linki
/cme - Son koronal kütle atımları
/alerts - NOAA ve SpaceWeather uyarıları
/about - Bot hakkında
    `;
    await sendMessage(chat_id, helpMsg);
  } else if (text === '/status') {
    const status = await getStatus();
    await sendMessage(chat_id, status);
  } else {
    await sendMessage(chat_id, 'Bilinmeyen komut. /help yazarak komutları görebilirsin.');
  }

  res.status(200).send('OK');
}

// Mesaj gönderme fonksiyonu
async function sendMessage(chat_id, text) {
  const url = `${TELEGRAM_API}/sendMessage`;
  const body = {
    chat_id,
    text,
    parse_mode: 'Markdown'
  };

  await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

// NOAA API’den veri çekip durum mesajı oluşturma
async function getStatus() {
  try {
    const res = await fetch('https://services.swpc.noaa.gov/json/geomagnetic-conditions.json');
    const data = await res.json();
    const latest = data[data.length - 1];
    const kp = latest.kp_index;
    const storm = kp >= 5 ? 'Jeomanyetik fırtına var!' : 'Jeomanyetik fırtına yok.';
    return `🌍 Güneş Fırtınası Durumu\nKp Endeksi: ${kp}\nDurum: ${storm}`;
  } catch (e) {
    return 'Veri alınırken hata oluştu.';
  }
}
