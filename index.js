"use strict";
// https://nodejs.org/api/querystring.html
const {stringify} = require("querystring");
// https://nodejs.org/api/http.html
const http = require("http");
// https://nodejs.org/api/https.html
const https = require("https");

// API трекинга МКС http://open-notify.org/Open-Notify-API/ISS-Location-Now/
// http://open-notify.org/Open-Notify-API/ISS-Location-Now/
const apiIss = "http://api.open-notify.org/iss-now.json";
// API Яндекс.Карт
// https://tech.yandex.ru/maps/geocoder/doc/desc/concepts/input_params-docpage/
const apiGeo = "https://geocode-maps.yandex.ru/1.x/";
// Секретик ключа лежит в переменной окружения
// https://nodejs.org/api/process.html#process_process_env
const apiGeoKey = process.env.key;

// Для serverless приложения нужно написать вызовы к API на «чистой ноде» (наверное)
// https://cloud.yandex.ru/docs/functions/concepts/function
// С решением вопроса записи ответа в переменную помог https://github.com/k03mad
// «обернул в промис, чтобы можно было последовательно вызывать»
const getHttp = url => new Promise((resolve, reject) => {
    http.get(url, res => {
        // В ноде нет возможности сразу получить тело запроса
        // https://stackoverflow.com/questions/6968448/where-is-body-in-a-nodejs-http-get-response
        // Нужно использовать пример из документации
        if (res.statusCode === 200) {
            let rawData = "";
            res.on("data", chunk => {
                rawData += chunk;
            });
            res.on("end", () => {
                try {
                    const response = JSON.parse(rawData);
                    resolve(response);
                } catch (err) {
                    reject(err.message);
                }
            }).on("error", err => {
                console.log(`Error: ${err.message}`);
            });
        } else {
            console.log("Error");
        }
    });
});

const getHttps = url => new Promise((resolve, reject) => {
    https.get(url, res => {
        if (res.statusCode === 200) {
            let rawData = "";
            res.on("data", chunk => {
                rawData += chunk;
            });
            res.on("end", () => {
                try {
                    const response = JSON.parse(rawData);
                    resolve(response);
                } catch (err) {
                    reject(err.message);
                }
            }).on("error", err => {
                console.log(`Error: ${err.message}`);
            });
        } else {
            console.log("Error");
        }
    });
});

// Создание навыка в Яндекс.Облаке
// https://cloud.yandex.ru/docs/functions/solutions/alice-skill
// Создание функции в Яндекс.Облаке
// https://yandex.ru/dev/dialogs/alice/doc/deploy-ycloud-function-docpage/#create-function
// Пример навыка с использованием serverless функции
// https://github.com/yandex-cloud/examples/blob/master/serverless/functions/alice/nodejs/parrot/index.js
/**
 * Entry-point for Serverless Function.
 *
 * @param event {Object} request payload.
 *
 * @return {Promise<Object>} response to be serialized as JSON.
 */
module.exports.handler = async (event) => {
    // https://yandex.ru/dev/dialogs/alice/doc/protocol-docpage/
    const {request, version, session} = event;

    // Навык ДОЛЖЕН содержать приветственное сообщение и help
    // https://yandex.ru/dev/dialogs/alice/doc/requirements-docpage/#specific__content
    const textWelcome = "МКС на орбите. Уточнить где сейчас пролетает?";
    const textHelp = "На любую фразу отвечу над чем пролетает МКС";

    // Ответы подсмотрены в навыке
    // https://github.com/tadatuta/alice-songs/blob/master/lib/logic.js
    if (session.new) {
        return {
            version,
            session,
            response: {
                text: textWelcome,
                end_session: false
            }
        };
    }

    const command = request.command.toLowerCase();

    if (command.includes("помощь") || command.includes("что ты умеешь")) {
        return {
            version,
            session,
            response: {
                text: textHelp,
                end_session: false
            }
        };
    }

    const resIss = await getHttp(apiIss);
    // Долгота
    let long = Number(resIss.iss_position.longitude);
    // Широта
    let lat = Number(resIss.iss_position.latitude);

    // «Request path should include query string»
    const queryData = stringify({
        geocode: `${long},${lat}`,
        apikey: apiGeoKey,
        sco: "longlat",
        kind: "locality",
        format: "json",
        results: 1,
        lang: "ru_RU"
    });

    const resGeo = await getHttps(`${apiGeo}?${queryData}`);

    let foundObjects = resGeo.response.GeoObjectCollection.featureMember.length;

    let textGeo;

    if (foundObjects === 0 && lat > 0) {
        textGeo = "Где-то над северным полушарием";
    } else if (foundObjects === 0 && lat < 0) {
        textGeo = "Где-то над южным полушарием";
    } else if (foundObjects === 0 && lat === 0) {
        textGeo = "Где-то над экватором";
    } else {
        textGeo = resGeo.response.GeoObjectCollection.featureMember[0].GeoObject.metaDataProperty.GeocoderMetaData.text;
    }

    return {
        version,
        session,
        response: {
            text: textGeo,
            // Завершаем разговор после ответа
            end_session: true
        }
    };
};