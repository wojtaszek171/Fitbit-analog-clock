import * as messaging from "messaging";
import { settingsStorage } from "settings";
import { geolocation } from "geolocation";
import {
  companionCommands,
  appCommands,
  tempIds,
  errorMessages,
} from "../globals";
import { device } from "peer";
import {
  getAPIKey,
  getCornerSettings,
  getTemperatureUnit,
  getUpdateEvery,
  getWeatherCityName,
  getIsHRIconDisabled,
  getIsWeatherConfigured,
  isGPSEnabled,
} from "./settingsSelector";

const getWeatherUrlUnit = (unit) => {
  switch (unit) {
    case tempIds.f:
      return "imperial";
    case tempIds.k:
      return "standard";
    case tempIds.c:
    default:
      return "metric";
  }
};

const queryTodayOpenWeather = () => {
  const API_KEY = getAPIKey();
  const updateEvery = getUpdateEvery();
  const temperatureUnit = getTemperatureUnit();
  const weatherConfigured = getIsWeatherConfigured();

  let message = {
    command: companionCommands.todayWeather,
    displayWeather: weatherConfigured,
    hasApi: API_KEY.length > 0,
    cityName: "",
    temperature: "",
    weatherElement: {},
    updateEveryMinutes: updateEvery,
    error: null,
    temperatureUnit,
  };

  if (weatherConfigured) {
    let parameters = `?units=${getWeatherUrlUnit(temperatureUnit)}`;

    if (isGPSEnabled()) {
      geolocation.getCurrentPosition(
        (position) => {
          parameters +=
            "&lat=" +
            position.coords.latitude +
            "&lon=" +
            position.coords.longitude;

          fetchTodayWeather(parameters, API_KEY, message);
        },
        (error) => {
          message.error = errorMessages.gpsFail;
          messaging.peerSocket.send(message);
        },
        {
          timeout: 60 * 1000,
        }
      );
    } else {
      parameters += "&q=" + getWeatherCityName();
      fetchTodayWeather(parameters, API_KEY, message);
    }
  } else {
    messaging.peerSocket.send(message);
  }
};

const fetchTodayWeather = (parameters, API_KEY, message) => {
  let messageCopy = { ...message };

  fetch(
    `https://api.openweathermap.org/data/2.5/weather${parameters}&APPID=${API_KEY}`
  )
    .then((response) => {
      response.json().then((data) => {
        if (data.message) {
          return displayApiError(data);
        }

        messageCopy.temperature = data.main.temp;
        messageCopy.weatherElement = data.weather[0];
        messageCopy.cityName = data.name ? data.name : "????";

        messaging.peerSocket.send(messageCopy);
      });
    })
    .catch((err) => {
      messageCopy.error = errorMessages.fetchError;
      messaging.peerSocket.send(messageCopy);
    });
};

const query5daysOpenWeather = () => {
  const API_KEY = getAPIKey();
  const temperatureUnit = getTemperatureUnit();
  const weatherConfigured = getIsWeatherConfigured();

  let message = {
    command: companionCommands.forecastWeather,
    displayWeather: weatherConfigured,
    cityName: "",
    error: null,
    temperatureUnit,
  };

  if (weatherConfigured) {
    let parameters = `?units=${getWeatherUrlUnit(temperatureUnit)}`;

    if (isGPSEnabled()) {
      geolocation.getCurrentPosition(
        (position) => {
          parameters +=
            "&lat=" +
            position.coords.latitude +
            "&lon=" +
            position.coords.longitude;

          fetch5daysWeather(parameters, API_KEY, message);
        },
        (error) => {
          message.error = errorMessages.gpsFail;
          messaging.peerSocket.send(message);
        },
        {
          timeout: 60 * 1000,
        }
      );
    } else {
      parameters += "&q=" + getWeatherCityName();
      fetch5daysWeather(parameters, API_KEY, message);
    }
  } else {
    messaging.peerSocket.send(message);
  }
};

const fetch5daysWeather = (parameters, API_KEY, message) => {
  let messageCopy = { ...message };
  let weatherDaysMessage = [];
  const temperatureUnit = getTemperatureUnit();

  fetch(
    `https://api.openweathermap.org/data/2.5/forecast${parameters}&APPID=${API_KEY}`
  )
    .then((response) => {
      response.json().then((data) => {
        if (data.message) {
          return displayApiError(data);
        }

        messageCopy.cityName = data.city.name ? data.city.name : "????";

        let dayWeather = [];
        let lastDay = null;
        data.list.forEach((hourlyWeather, i) => {
          const date = new Date(hourlyWeather.dt * 1000);
          const day = date.getDay();
          if (lastDay !== day) {
            if (i !== 0) {
              weatherDaysMessage.push(dayWeather);
            }
            lastDay = day;
            dayWeather = [];
          }

          dayWeather.push({
            day,
            hour: date.getHours(),
            icon: hourlyWeather.weather[0].icon,
            temperature: hourlyWeather.main.temp,
          });
        });

        messaging.peerSocket.send(messageCopy);
        weatherDaysMessage.forEach((weatherDayMessage, i) => {
          messaging.peerSocket.send({
            svgElement: (i + 1).toString(),
            command: companionCommands.forecastWeather,
            weatherDayMessage,
            temperatureUnit,
          });
        });
      });
    })
    .catch((err) => {
      messageCopy.error = errorMessages.fetchError;
      messaging.peerSocket.send(messageCopy);
    });
};

const displayApiError = (data) => {
  let message = "";

  switch (data.cod) {
    case 401:
      message = errorMessages.wrongApiKey;
      break;
    case 429:
      message = errorMessages.apiLimit;
      break;
    default:
      message = errorMessages.weatherUnknown;
      break;
  }

  messaging.peerSocket.send({
    error: message,
  });
};

const returnStatsSettingsValues = () => {
  messaging.peerSocket.send({
    command: companionCommands.statsSettings,
    payload: getCornerSettings(),
  });
};

const returnHRToggleValue = () => {
  messaging.peerSocket.send({
    command: companionCommands.disableHRSetting,
    disabled: getIsHRIconDisabled(),
  });
};

const returnWeatherConfiguredValue = () => {
  messaging.peerSocket.send({
    command: companionCommands.weatherConfigured,
    weatherConfigured: getIsWeatherConfigured(),
  });
};

settingsStorage.setItem("modelId", device.modelId);

messaging.peerSocket.onmessage = (evt) => {
  if (!evt.data) {
    return;
  }

  switch (evt.data.command) {
    case appCommands.todayWeather:
      queryTodayOpenWeather();
      break;
    case appCommands.forecastWeather:
      query5daysOpenWeather();
      break;
    case appCommands.statsSettings:
      returnStatsSettingsValues();
      break;
    case appCommands.disableHRSetting:
      returnHRToggleValue();
      break;
    case appCommands.weatherConfigured:
      returnWeatherConfiguredValue();
      break;
    default:
      break;
  }
};

messaging.peerSocket.onerror = (err) => {
  console.log("Connection error: " + err.code + " - " + err.message);
};

settingsStorage.onchange = (evt) => {
  switch (evt.key) {
    case "ltStatSel":
    case "rtStatSel":
    case "lbStatSel":
    case "rbStatSel":
    case "enableWeather":
      messaging.peerSocket.send({
        command: companionCommands.settingsChanged,
        payload: evt,
      });
      break;
    case "disableHRToggle":
      messaging.peerSocket.send({
        command: companionCommands.disableHRSetting,
        disabled: getIsHRIconDisabled(),
      });
    default:
      queryTodayOpenWeather();
      break;
  }
};
