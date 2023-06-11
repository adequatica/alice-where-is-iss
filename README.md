# Where is ISS

Serverless [skill for Alice](https://alice.ya.ru/s/38592329-ff16-41ac-b0b5-605669e888e7) ([virtual assistant](https://en.wikipedia.org/wiki/Alice_(virtual_assistant))) based on Node.js.

It informs which area of the earth the international space station is currently flying over.

### How does it work?

The user says: «*Alice, launch the skill Where is the ISS*».

Alice responds with a welcome skill message: «*The ISS is in orbit. To clarify where it is flying now?*»

On any following phrase of the user occurs:
* Going to the [Open Notify API](http://open-notify.org/Open-Notify-API/ISS-Location-Now/) for the current coordinates of the ISS;
* Transmitting coordinates to the [Geocoder](https://yandex.com/dev/maps/geocoder/) with the receipt of a locality in response;
* In the case of overflight over an unpopulated area, then the definitions of the hemisphere;
* Response to the user about the location of the station (locality or hemisphere).

The deployment occurs via the [Yandex Cloud Functions](https://cloud.yandex.com/en/services/functions).

----

# Где МКС

Бессерверный [навык Алисы](https://alice.ya.ru/s/38592329-ff16-41ac-b0b5-605669e888e7) на Node.js.

Сообщает над какой областью земли сейчас пролетает международная космическая станция.

### Как он работает?

Пользователь говорит: «*Алиса, запусти навык где мкс*».

Алиса отвечает приветственным сообщением навыка: «*мкс на орбите. уточнить где сейчас пролетает*».

На любую следующую фразу пользователя происходит:
* Поход в [Open Notify API](http://open-notify.org/Open-Notify-API/ISS-Location-Now/) за текущими координатами МКС;
* Передача координат в [Геокодер](https://tech.yandex.ru/maps/geocoder/) с получением в ответ населенного пункта;
* В случае пролета над безлюдной территорией, то определения полушария;
* Ответ пользователю о местонахождении станции (населенный пункт или полушарие).

Деплой происходит через [Функцию в Яндекс.Облаке](https://yandex.ru/dev/dialogs/alice/doc/deploy-ycloud-function-docpage/).
