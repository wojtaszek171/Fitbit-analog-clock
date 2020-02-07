import * as messaging from "messaging";
import { settingsStorage } from "settings";

// var API_KEY = "1cf2c3eae1fe3846b909ba2dd067234e";
const API_KEY = JSON.parse(settingsStorage.getItem("weatherApiKey")).name;
                  
// Fetch the weather from OpenWeather
function queryOpenWeather() {
  const cityName = JSON.parse(settingsStorage.getItem("weatherCity")).name;
  const weatherEnabled = settingsStorage.getItem("enableWeather");

  let weather = {
    enabled: weatherEnabled,
    cityName: cityName,
    temperature: '',
    weatherElements: [],
    fetchTime: ''
  };

  if (weatherEnabled === 'true') {
    const ENDPOINT = "https://api.openweathermap.org/data/2.5/weather" +
                    "?q=" + cityName +
                    "&units=metric";
    fetch(ENDPOINT + "&APPID=" + API_KEY)
    .then(function (response) {
        response.json()
        .then(function(data) {
          weather.temperature = data["main"]["temp"];
          weather.weatherElements = data["weather"];
          weather.fetchTime = data["dt"];
          // Send the weather data to the device          
          returnWeatherData(weather);
        });
    })
    .catch(function (err) {
      console.log("Error fetching weather: " + err);
    });
  } else {
    returnWeatherData(weather);
  }
}

// Send the weather data to the device
function returnWeatherData(data) {
  if (messaging.peerSocket.readyState === messaging.peerSocket.OPEN) {
    // Send a command to the device    
    messaging.peerSocket.send(data);
  } else {
    console.log("Error: Connection is not open");
  }
}

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
    case "weatherCity":
      queryOpenWeather();
      break;
    case "enableWeather":
      queryOpenWeather();
      break;
    default:
      break;
  }
}