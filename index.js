"use strict";
// https://nodejs.org/api/querystring.html
const { stringify } = require("querystring");
// https://nodejs.org/api/http.html
const http = require("http");
// https://nodejs.org/api/https.html
const https = require("https");

// International Space Station Current Location
// http://open-notify.org/Open-Notify-API/ISS-Location-Now/
const apiIss = "http://api.open-notify.org/iss-now.json";
// MapBox Geocoding API
// https://docs.mapbox.com/api/search/geocoding/
const apiGeocode = "https://api.mapbox.com/search/geocode/v6/reverse";
// Secret key is stored in environment variable
// https://nodejs.org/api/process.html#process_process_env
const apiGeocodeKey = process.env.key;

const nullIsland = JSON.parse(
  '{"iss_position": {"longitude": "0","latitude": "0"}}'
);
const pointNemo = JSON.parse('{"features": []}');

// For a serverless application, you need to write API calls on a «pure node» (probably)
// https://cloud.yandex.com/en/docs/functions/concepts/function
// To write the response to a variable, helped https://github.com/k03mad, you need to
// «wrap it in a promise so that you can consistently call it»
//
// This function is used only for ISS API requests
const getHttp = (url) =>
  new Promise((resolve, reject) => {
    const req = http.get(url, (res) => {
      // There is no way to get the request body immediately in the «pure node»
      // https://stackoverflow.com/questions/6968448/where-is-body-in-a-nodejs-http-get-response
      if (res.statusCode === 200) {
        let rawData = "";
        res.on("data", (chunk) => {
          rawData += chunk;
        });
        res
          .on("end", () => {
            try {
              const response = JSON.parse(rawData);
              resolve(response);
            } catch (err) {
              reject(err.message);
            }
          })
          .on("error", (err) => {
            // Instead of an error, here returns zero coordinates to prevent a failed skill
            resolve(nullIsland);
            console.log(`Error: ${err.message}`);
          });
      } else {
        // Instead of an error, here returns zero coordinates to prevent a failed skill
        resolve(nullIsland);
        console.log("Error");
      }
    });

    req.setTimeout(2000, () => {
      // Instead of an error by timeout, here returns zero coordinates to prevent a failed skill
      resolve(nullIsland);
    });
  });

// This function is used only for MapBox API requests
const getHttps = (url) =>
  new Promise((resolve, reject) => {
    const req = https.get(url, (res) => {
      if (res.statusCode === 200) {
        let rawData = "";
        res.on("data", (chunk) => {
          rawData += chunk;
        });
        res
          .on("end", () => {
            try {
              const response = JSON.parse(rawData);
              resolve(response);
            } catch (err) {
              reject(err.message);
            }
          })
          .on("error", (err) => {
            // Instead of an error, here returns "nothing was found" to prevent a failed skill
            resolve(pointNemo);
            console.log(`Error: ${err.message}`);
          });
      } else {
        // Instead of an error, here returns "nothing was found" to prevent a failed skill
        resolve(pointNemo);
        console.log("Error");
      }
    });

    req.setTimeout(2000, () => {
      // Instead of an error by timeout, here returns "nothing was found" to prevent a failed skill
      resolve(pointNemo);
    });
  });

// Creating skills for Alice
// https://cloud.yandex.com/en/docs/functions/tutorials/alice-skill
// Creating a serverless function in Yandex.Cloud
// https://yandex.ru/dev/dialogs/alice/doc/deploy-ycloud-function-docpage/#create-function
// Example of a skill using a serverless function
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
  const { request, version, session } = event;

  // Skill MUST contain welcome message and help
  // https://yandex.ru/dev/dialogs/alice/doc/ru/requirements#greeting
  // "The ISS is in orbit. Say any phrase to find out where it is flying above the Earth"
  const textWelcome =
    "МКС на орбите. Скажите любую фразу, чтобы узнать где она пролетает над землёй";
  // "To any phrase you will get the answer to where the ISS is flying right now"
  const textHelp = "На любую фразу вы получите ответ где сейчас пролетает МКС";

  // The ways of answers are spied in the skill:
  // https://github.com/tadatuta/alice-songs/blob/master/lib/logic.js
  if (session.new) {
    return {
      version,
      session,
      response: {
        text: textWelcome,
        end_session: false,
      },
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
        end_session: false,
      },
    };
  }

  const resIss = await getHttp(apiIss);
  // Longitude / Долгота
  let long = Number(resIss.iss_position.longitude);
  // Latitude / Широта
  let lat = Number(resIss.iss_position.latitude);

  // Request path should include query string
  // https://docs.mapbox.com/api/search/geocoding/#reverse-geocoding
  const queryData = stringify({
    longitude: long,
    latitude: lat,
    access_token: `${apiGeocodeKey}`,
    types: "place",
    language: "ru",
    worldview: "ru",
  });

  const resGeocode = await getHttps(`${apiGeocode}?${queryData}`);

  let foundObjects = resGeocode.features;

  let textGeo;

  if (foundObjects.length === 0 && lat === 0) {
    // "Somewhere above the equator"
    textGeo = "Где-то над экватором";
  } else if (foundObjects.length === 0 && lat > 0) {
    // "Somewhere over the northern hemisphere"
    textGeo = "Где-то над северным полушарием";
  } else if (foundObjects.length === 0 && lat < 0) {
    // "Somewhere over the southern hemisphere"
    textGeo = "Где-то над южным полушарием";
  } else {
    textGeo = foundObjects[0].properties.name_preferred;
  }

  return {
    version,
    session,
    response: {
      text: textGeo,
      // Finish dialog after answer
      end_session: true,
    },
  };
};
