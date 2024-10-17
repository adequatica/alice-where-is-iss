# Where is the ISS

**Serverless [skill for Alice](https://dialogs.yandex.com/store/skills/3b4d3762-gde-mks)** ([virtual assistant](<https://en.wikipedia.org/wiki/Alice_(virtual_assistant)>)) based on Node.js.

It informs which area of the earth the International Space Station is currently flying over.

### How does it work?

The user says: «_Alice, launch the skill Where is the ISS_».

Alice responds with a welcome skill message: «_The ISS is in orbit. Say any phrase to find out where it is flying above the Earth_»

On any following phrase of the user occurs:

1. Going to the [Open Notify API](http://open-notify.org/Open-Notify-API/ISS-Location-Now/) for the current coordinates of the ISS;
2. Transmitting coordinates to the [MapBox Reverse geocoding API](https://docs.mapbox.com/api/search/geocoding/#reverse-geocoding) with the response of a current locality;
3. In the case of overflight over an unpopulated area, then the definitions of the hemisphere;
4. Response to the user about the location of the station (locality or hemisphere).

The deployment occurs via the [Yandex Cloud Functions](https://cloud.yandex.com/en/services/functions).
