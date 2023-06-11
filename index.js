"use strict";
// https://nodejs.org/api/querystring.html
const {stringify} = require("querystring");
// https://nodejs.org/api/http.html
const http = require("http");
// https://nodejs.org/api/https.html
const https = require("https");

// International Space Station Current Location
// http://open-notify.org/Open-Notify-API/ISS-Location-Now/
const apiIss = "http://api.open-notify.org/iss-now.json";
// Yandex.Maps API / API Яндекс.Карт
// https://yandex.ru/dev/geocode/doc/ru/concepts/input-params
// https://yandex.ru/dev/geocode/doc/en/concepts/input-params
const apiGeo = "https://geocode-maps.yandex.ru/1.x/";
// Secret key is stored in environment variable
// Секретик ключа лежит в переменной окружения
// https://nodejs.org/api/process.html#process_process_env
const apiGeoKey = process.env.key;

// For a serverless application, you need to write API calls on a «pure node» (probably)
// Для serverless приложения нужно написать вызовы к API на «чистой ноде» (наверное)
// https://cloud.yandex.com/en/docs/functions/concepts/function
// To write the response to a variable, helped https://github.com/k03mad, you need to
// «wrap it in a promise so that you can consistently call it»
// Для записи ответа в переменную помог https://github.com/k03mad, нужно
// «обернуть в промис, чтобы можно было последовательно вызывать»
const getHttp = url => new Promise((resolve, reject) => {
    http.get(url, res => {
        // There is no way to get the request body immediately in the «pure node»
        // https://stackoverflow.com/questions/6968448/where-is-body-in-a-nodejs-http-get-response
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

// Creating skills for Alice
// Создание навыка в Яндекс.Облаке
// https://cloud.yandex.com/en/docs/functions/tutorials/alice-skill
// Creating a serverless function in Yandex.Cloud
// Создание функции в Яндекс.Облаке
// https://yandex.ru/dev/dialogs/alice/doc/deploy-ycloud-function-docpage/#create-function
// Example of a skill using a serverless function
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

    // Skill MUST contain welcome message and help
    // Навык ДОЛЖЕН содержать приветственное сообщение и help
    // https://yandex.ru/dev/dialogs/alice/doc/requirements-docpage/#specific__content
    // "The ISS is in orbit. To clarify where it is flying now?"
    const textWelcome = "МКС на орбите. Уточнить где сейчас пролетает?";
    // "To any phrase I will answer what the ISS is flying over"
    const textHelp = "На любую фразу отвечу над чем пролетает МКС";

    // The ways of answers are spied in the skill:
    // Способы ответов подсмотрены в навыке:
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

    // "help" || "what can you do"
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
    // Longitude / Долгота
    let long = Number(resIss.iss_position.longitude);
    // Latitude / Широта
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
        // "Somewhere over the northern hemisphere"
        textGeo = "Где-то над северным полушарием";
    } else if (foundObjects === 0 && lat < 0) {
        // "Somewhere over the southern hemisphere"
        textGeo = "Где-то над южным полушарием";
    } else if (foundObjects === 0 && lat === 0) {
        // "Somewhere above the equator"
        textGeo = "Где-то над экватором";
    } else {
        textGeo = resGeo.response.GeoObjectCollection.featureMember[0].GeoObject.metaDataProperty.GeocoderMetaData.text;
    }

    return {
        version,
        session,
        response: {
            text: textGeo,
            // Finish dialog after answer
            // Завершаем разговор после ответа
            end_session: true
        }
    };
};