import * as messaging from "messaging";
import { settingsStorage } from "settings";
import { geolocation } from "geolocation";

// Fetch the weather from OpenWeather
function queryOpenWeather() {
  const API_KEY = JSON.parse(settingsStorage.getItem("weatherApiKey")).name ? JSON.parse(settingsStorage.getItem("weatherApiKey")).name : '';

  let cityName = JSON.parse(settingsStorage.getItem("weatherCity")).name ? JSON.parse(settingsStorage.getItem("weatherCity")).name : '';
  const weatherEnabled = settingsStorage.getItem("enableWeather");
  const gpsEnabled = settingsStorage.getItem("gpsEnabled");

  let weather = {
    enabled: weatherEnabled,
    cityName: cityName,
    temperature: '',
    weatherElements: [],
    fetchTime: '',
    updateEveryMinutes: null,
    error: null
  };

  if (weatherEnabled === 'true' && API_KEY && (cityName || gpsEnabled === 'true')) {
    let ENDPOINT = "https://api.openweathermap.org/data/2.5/weather" +
                    "?units=metric";
    if (gpsEnabled === 'true') {      
      geolocation.getCurrentPosition((position) => {
        ENDPOINT += "&lat="+ position.coords.latitude +"&lon=" + position.coords.longitude;

        fetchWeather(ENDPOINT, API_KEY, weather);
      },
      (error) => {
        weather.error = "Failed to use gps";
        messaging.peerSocket.send(weather);
      }, {
        timeout: 60 * 1000
      });

    } else {
      ENDPOINT += "&q=" + cityName;
      fetchWeather(ENDPOINT, API_KEY, weather);
    }
  } else {
    messaging.peerSocket.send(weather);
  }
}

const fetchWeather = (ENDPOINT, API_KEY, weather) => {
  const updateEvery = JSON.parse(settingsStorage.getItem("updateEvery")).values[0].value;

  fetch(ENDPOINT + "&APPID=" + API_KEY)
  .then(function (response) {
      response.json()
      .then(function(data) {                
        weather.temperature = data["main"]["temp"];
        weather.weatherElements = data["weather"];
        weather.fetchTime = data["dt"];
        weather.updateEveryMinutes = updateEvery;
        if (data["name"]) {
          weather.cityName = data["name"];
        }
        // Send the weather data to the device          
        messaging.peerSocket.send(weather);
      });
  })
  .catch(function (err) {
    weather.error = "There is an error. Check your weather API key and Internet connection.";
    messaging.peerSocket.send(weather);
  });
};

// Listen for messages from the device
messaging.peerSocket.onmessage = function(evt) {
  if (evt.data && evt.data.command == "weather") {
    // The device requested weather data
    queryOpenWeather();
  }
}

// Listen for the onerror event
messaging.peerSocket.onerror = function(err) {
  // Handle any errors
  console.log("Connection error: " + err.code + " - " + err.message);
}

settingsStorage.onchange = function(evt) {
  switch (evt.key) {
    default:
      queryOpenWeather();
      break;
  }
}
