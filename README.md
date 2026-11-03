# Block Blast Düello

İki kişilik, oda kodlu Block Blast. Node.js + WebSocket.

## Kurulum
```
npm install
npm start
```
Tarayıcıda http://localhost:3000 aç. Port için: `PORT=8080 npm start`

## Oynanış
1. Biri "Oda kur" der, 4 haneli kodu alır.
2. Diğeri kodu girip "Odaya katıl" der. İkisi de bağlanınca oyun başlar.
3. Parçalar iki oyuncuda aynıdır. Skoru yüksek olan kazanır.

## Sunucuya koyarken
- Aynı sunucu hem sayfayı hem WebSocket'i verir, ekstra ayar gerekmez.
- HTTPS kullanıyorsan (nginx/Caddy arkasında) WebSocket yönlendirmesini aç.
  nginx için: `proxy_set_header Upgrade $http_upgrade; proxy_set_header Connection "upgrade"; proxy_http_version 1.1;`
- Oda başına en fazla 2 kişi girebilir. Odalar bellekte tutulur, sunucu yeniden başlarsa sıfırlanır.

## Dosyalar
- `server.js` : statik dosya sunucusu + oda yönetimi
- `public/index.html` : oyun (istemci)
