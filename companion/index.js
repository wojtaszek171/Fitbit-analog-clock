import * as messaging from "messaging";
import settings, { settingsStorage } from "settings";
import { geolocation } from "geolocation";

const queryTodayOpenWeather = () => {
  const weatherApiSetting = JSON.parse(settingsStorage.getItem("weatherApiKey"));
  const API_KEY = weatherApiSetting ? weatherApiSetting.name : '';

  const weatherCitySetting = JSON.parse(settingsStorage.getItem("weatherCity"));
  let cityName = weatherCitySetting ? weatherCitySetting.name : '';
  const weatherEnabled = settingsStorage.getItem("enableWeather");
  const gpsEnabled = settingsStorage.getItem("gpsEnabled");
  const temperatureUnit = JSON.parse(settingsStorage.getItem("temperatureUnit"));

  let weather = {
    command: 'todayWeather',
    enabled: weatherEnabled,
    hasApi: API_KEY.length > 0,
    cityName: '',
    temperature: '',
    weatherElement: {},
    updateEveryMinutes: null,
    error: null,
    temperatureUnit: temperatureUnit ? temperatureUnit.values[0].value : 2
  };

  if (weatherEnabled === 'true' && API_KEY && (cityName || gpsEnabled === 'true')) {
    let ENDPOINT = "https://api.openweathermap.org/data/2.5/weather";
        
    switch (temperatureUnit ? temperatureUnit.values[0].value : 2) {
      case 0:
        ENDPOINT += "?units=imperial";
        break;
      case 1:
        ENDPOINT += "?units=standard";
        break;
      case 2:
        ENDPOINT += "?units=metric";
        break;
      default:
        break;
    }

    if (gpsEnabled === 'true') {      
      geolocation.getCurrentPosition((position) => {
        ENDPOINT += "&lat="+ position.coords.latitude +"&lon=" + position.coords.longitude;

        fetchTodayWeather(ENDPOINT, API_KEY, weather);
      },
      (error) => {
        weather.error = "Failed to use gps";
        messaging.peerSocket.send(weather);
      }, {
        timeout: 60 * 1000
      });

    } else {
      ENDPOINT += "&q=" + cityName;
      fetchTodayWeather(ENDPOINT, API_KEY, weather);
    }
  } else {
    messaging.peerSocket.send(weather);
  }
}

const fetchTodayWeather = (ENDPOINT, API_KEY, weather) => {
  const updateEverySetting = JSON.parse(settingsStorage.getItem("updateEvery"));
  const updateEvery = updateEverySetting ? updateEverySetting.values[0].value : 30;
  
  fetch(ENDPOINT + "&APPID=" + API_KEY)
  .then((response) => {
      response.json()
      .then((data) => {                           
        weather.temperature = data.main.temp;
        weather.weatherElement = data.weather[0];
        weather.updateEveryMinutes = updateEvery;
        if (data.name) {
          weather.cityName = data.name;
        } else {
          weather.cityName = "????";
        }
        // Send the weather data to the device          
        messaging.peerSocket.send(weather);
      });
  })
  .catch((err) => {
    weather.error = "There is an error. Check your weather API key and Internet connection.";
    messaging.peerSocket.send(weather);
  });
};

const query5daysOpenWeather = () => {
  const API_KEY = JSON.parse(settingsStorage.getItem("weatherApiKey")).name ? JSON.parse(settingsStorage.getItem("weatherApiKey")).name : '';

  const cityNameSetting = JSON.parse(settingsStorage.getItem("weatherCity"));
  let cityName = cityNameSetting ? cityNameSetting.name : '';
  const weatherEnabled = settingsStorage.getItem("enableWeather");
  const gpsEnabled = settingsStorage.getItem("gpsEnabled");
  const temperatureUnit = JSON.parse(settingsStorage.getItem("temperatureUnit"));

  let message = {
    command: 'forecastWeather',
    enabled: weatherEnabled,
    cityName: '',
    error: null,
    temperatureUnit: temperatureUnit ? temperatureUnit.values[0].value : 2
  };

  if (weatherEnabled === 'true' && API_KEY && (cityName || gpsEnabled === 'true')) {
    let ENDPOINT = "https://api.openweathermap.org/data/2.5/forecast";

    switch (temperatureUnit ? temperatureUnit.values[0].value : 2) {
      case 0:
        ENDPOINT += "?units=imperial";
        break;
      case 1:
        ENDPOINT += "?units=standard";
        break;
      case 2:
        ENDPOINT += "?units=metric";
        break;
      default:
        break;
    }
                    
    if (gpsEnabled === 'true') {      
      geolocation.getCurrentPosition((position) => {
        ENDPOINT += "&lat="+ position.coords.latitude +"&lon=" + position.coords.longitude;

        fetch5daysWeather(ENDPOINT, API_KEY, message);
      },
      (error) => {
        message.error = "Failed to use gps";
        messaging.peerSocket.send(message);
      }, {
        timeout: 60 * 1000
      });

    } else {
      ENDPOINT += "&q=" + cityName;
      fetch5daysWeather(ENDPOINT, API_KEY, message);
    }
  } else {
    messaging.peerSocket.send(message);
  }
}

const fetch5daysWeather = (ENDPOINT, API_KEY, message) => {
  let weatherDaysMessage = [];
  const temperatureUnit = JSON.parse(settingsStorage.getItem("temperatureUnit"));

  fetch(ENDPOINT + "&APPID=" + API_KEY)
  .then((response) => {
      response.json()
      .then((data) => {            
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
            command: 'forecastWeather',
            weatherDayMessage,
            temperatureUnit: temperatureUnit ? temperatureUnit.values[0].value : 2
          });
        });
      });
  })
  .catch((err) => {
    message.error = "There is an error. Check your weather API key and Internet connection.";
    messaging.peerSocket.send(message);
  });
};

messaging.peerSocket.onmessage = (evt) => {
  if (evt.data && evt.data.command == "todayWeather") {
    queryTodayOpenWeather();
  }
  if (evt.data && evt.data.command == "forecastWeather") {
    query5daysOpenWeather();
  }
}

messaging.peerSocket.onerror = (err) => {
  console.log("Connection error: " + err.code + " - " + err.message);
}

settingsStorage.onchange = (evt) => {
  switch (evt.key) {
    default:
      queryTodayOpenWeather();
      break;
  }
}
