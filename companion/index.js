import * as messaging from "messaging";
import { settingsStorage } from "settings";
import { geolocation } from "geolocation";
import { commands, statsIds, tempIds } from "../globals";
import { device } from "peer";

const isWeatherConfigured = () => {
  return !!(isWeatherEnabled() && (getWeatherCityName().length || isGPSEnabled()))
}

const isGPSEnabled = () => {
  const gpsEnabled = settingsStorage.getItem("gpsEnabled");
  return gpsEnabled === "true";
}

const isWeatherEnabled = () => {
  const weatherEnabled = settingsStorage.getItem("enableWeather");
  return weatherEnabled === "true";
}

const getWeatherCityName = () => {
  const weatherCitySetting = JSON.parse(settingsStorage.getItem("weatherCity"));
  return weatherCitySetting ? weatherCitySetting.name : '';
}

const getTemperatureUnit = () => {
  const temperatureUnit = JSON.parse(settingsStorage.getItem("temperatureUnit"));
  return temperatureUnit ? temperatureUnit.values[0].value : tempIds.c;
}

const getAPIKey = () => {
  const weatherApiSetting = JSON.parse(settingsStorage.getItem("weatherApiKey"));
  return weatherApiSetting ? weatherApiSetting.name : '';
}

const getUpdateEvery = () => {
  const updateEverySetting = JSON.parse(settingsStorage.getItem("updateEvery"));
  return updateEverySetting ? updateEverySetting.values[0].value : 30;
}

const queryTodayOpenWeather = () => {
  const API_KEY = getAPIKey();
  const updateEvery = getUpdateEvery();
  const temperatureUnit = getTemperatureUnit();
  const weatherConfigured = isWeatherConfigured();

  let weather = {
    command: commands.todayWeather,
    displayWeather: weatherConfigured,
    hasApi: API_KEY.length > 0,
    cityName: '',
    temperature: '',
    weatherElement: {},
    updateEveryMinutes: updateEvery,
    error: null,
    temperatureUnit
  };

  if (weatherConfigured) {
    let parameters = "?units=";
        
    switch (temperatureUnit) {
      case tempIds.f:
        parameters += "imperial";
        break;
      case tempIds.k:
        parameters += "standard";
        break;
      case tempIds.c:
        parameters += "metric";
        break;
      default:
        parameters += "metric";
        break;
    }

    if (isGPSEnabled()) {
      geolocation.getCurrentPosition((position) => {
        parameters += "&lat="+ position.coords.latitude +"&lon=" + position.coords.longitude;

        fetchTodayWeather(parameters, API_KEY, weather);
      },
      (error) => {
        weather.error = "Failed to use gps";
        messaging.peerSocket.send(weather);
      }, {
        timeout: 60 * 1000
      });
    } else {
      parameters += "&q=" + getWeatherCityName();
      fetchTodayWeather(parameters, API_KEY, weather);
    }
  } else {
    messaging.peerSocket.send(weather);
  }
}

const fetchTodayWeather = (parameters, API_KEY, weather) => {
  fetch(`https://api.openweathermap.org/data/2.5/weather${parameters}&APPID=${API_KEY}`)
  .then((response) => {
      response.json()
      .then((data) => {
        if (data.message) {
          return displayApiError(data);
        }

        weather.temperature = data.main.temp;
        weather.weatherElement = data.weather[0];
        if (data.name) {
          weather.cityName = data.name;
        } else {
          weather.cityName = "????";
        }
        messaging.peerSocket.send(weather);
      });
  })
  .catch((err) => {
    weather.error = "There is an error. Check your weather API key and Internet connection.";
    messaging.peerSocket.send(weather);
  });
};

const query5daysOpenWeather = () => {
  const API_KEY = getAPIKey();
  const temperatureUnit = getTemperatureUnit();
  const weatherConfigured = isWeatherConfigured();

  let message = {
    command: commands.forecastWeather,
    displayWeather: weatherConfigured,
    cityName: '',
    error: null,
    temperatureUnit
  };

  if (weatherConfigured) {
    let parameters = "?units=";
        
    switch (temperatureUnit) {
      case tempIds.f:
        parameters += "imperial";
        break;
      case tempIds.k:
        parameters += "standard";
        break;
      case tempIds.c:
        parameters += "metric";
        break;
      default:
        parameters += "metric";
        break;
    }
                    
    if (isGPSEnabled()) {      
      geolocation.getCurrentPosition((position) => {
        parameters += "&lat="+ position.coords.latitude +"&lon=" + position.coords.longitude;

        fetch5daysWeather(parameters, API_KEY, message);
      },
      (error) => {
        message.error = "Failed to use gps";
        messaging.peerSocket.send(message);
      }, {
        timeout: 60 * 1000
      });

    } else {
      parameters += "&q=" + getWeatherCityName();
      fetch5daysWeather(parameters, API_KEY, message);
    }
  } else {
    messaging.peerSocket.send(message);
  }
}

const fetch5daysWeather = (parameters, API_KEY, message) => {
  let weatherDaysMessage = [];
  const temperatureUnit = getTemperatureUnit();

  fetch(`https://api.openweathermap.org/data/2.5/forecast${parameters}&APPID=${API_KEY}`)
  .then((response) => {
      response.json()
      .then((data) => {      
        if (data.message) {
          return displayApiError(data);
        }
      
        if (data.city.name) {
          message.cityName = data.city.name;
        } else {
          message.cityName = "????";
        }
        let dayWeather = [];
        let lastDay = null;
        data.list.forEach((hourlyWeather, i) => {
          const date = new Date(hourlyWeather.dt *1000);
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
            temperature: hourlyWeather.main.temp
          });
        });
        
        messaging.peerSocket.send(message);
        weatherDaysMessage.forEach((weatherDayMessage, i) => {
          messaging.peerSocket.send({
            svgElement: (i+1).toString(),
            command: commands.forecastWeather,
            weatherDayMessage,
            temperatureUnit
          });
        });
      });
  })
  .catch((err) => {
    message.error = "There is an error. Check your weather API key and Internet connection.";
    messaging.peerSocket.send(message);
  });
};

const displayApiError = (data) => {
  let message = '';

  switch (data.cod) {
    case 401:
      message = 'Invalid weather API key';
      break;
    case 429:
      message = 'You reached API limit';
      break;
    default:
      message = 'Unknown weather server error';
      break;
  }

  const errorObj = {
    error: message
  }
  messaging.peerSocket.send(errorObj);
}

const returnStatsSettingsValues = () => {
  const ltStat = JSON.parse(settingsStorage.getItem("ltStatSel"));
  const rtStat = JSON.parse(settingsStorage.getItem("rtStatSel"));
  const lbStat = JSON.parse(settingsStorage.getItem("lbStatSel"));
  const rbStat = JSON.parse(settingsStorage.getItem("rbStatSel"));

  messaging.peerSocket.send({
    command: commands.getStatsSettings,
    payload: {
      ltStat: (ltStat && ltStat.values.length && !isWeatherEnabled()) ? ltStat.values[0].value : undefined,
      rtStat: (rtStat && rtStat.values.length) ? rtStat.values[0].value : statsIds.steps,
      lbStat: (lbStat && lbStat.values.length) ? lbStat.values[0].value : undefined,
      rbStat: (rbStat && rbStat.values.length) ? rbStat.values[0].value : undefined
    }
  });
}

const returnHRToggleValue = () => {
  messaging.peerSocket.send({
    command: commands.disableHRSetting,
    disabled: settingsStorage.getItem("disableHRToggle") === "true"
  });
}

settingsStorage.setItem("modelId", device.modelId);

messaging.peerSocket.onmessage = (evt) => {
  if (!evt.data) {
    return
  }

  switch (evt.data.command) {
    case commands.todayWeather:
      queryTodayOpenWeather();
      break;
    case commands.forecastWeather:
      query5daysOpenWeather();
      break;
    case commands.getStatsSettings:
      returnStatsSettingsValues();
      break;
    case commands.disableHRSetting:
      returnHRToggleValue();
      break;
    default:
      break;
  }
}

messaging.peerSocket.onerror = (err) => {
  console.log("Connection error: " + err.code + " - " + err.message);
}

settingsStorage.onchange = (evt) => {
  switch (evt.key) {
    case 'ltStatSel':
    case 'rtStatSel':
    case 'lbStatSel':
    case 'rbStatSel':
    case 'enableWeather':
      messaging.peerSocket.send({
        command: commands.settingsChanged,
        payload: evt
      });
      queryTodayOpenWeather();
      break;
    case 'disableHRToggle':
      messaging.peerSocket.send({
        command: commands.disableHRSetting,
        disabled: settingsStorage.getItem("disableHRToggle") === "true"
      });
    default:
      queryTodayOpenWeather();
      break;
  }
}
