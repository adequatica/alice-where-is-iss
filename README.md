# Где МКС

Serverless [навык Алисы](https://alice.ya.ru/s/38592329-ff16-41ac-b0b5-605669e888e7) на Node.js. Сообщает над какой областью пролетает международная космическая станция.

### Как это работает?

Пользователь говорит: «*Алиса, запусти навык где мкс*»;

Алиса отвечает приветственным сообщением навыка: «*мкс на орбите. уточнить где сейчас пролетает*»;

На любую следующую фразу происходит:
* Поход в [Open Notify API](http://open-notify.org/Open-Notify-API/ISS-Location-Now/) за текущеми координатами МКС;
* Передача координат в [Геокодер](https://tech.yandex.ru/maps/geocoder/) с получением в ответ населенного пункта;
* В случае пролета над безлюдной территорией, то определения полушария.

Деплой происходит через [Функцию в Яндекс.Облаке](https://yandex.ru/dev/dialogs/alice/doc/deploy-ycloud-function-docpage/).
