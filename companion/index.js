import * as messaging from "messaging";
import { settingsStorage } from "settings";
           
// Fetch the weather from OpenWeather
function queryOpenWeather() {
  const API_KEY = JSON.parse(settingsStorage.getItem("weatherApiKey")).name ? JSON.parse(settingsStorage.getItem("weatherApiKey")).name : '';

  const cityName = JSON.parse(settingsStorage.getItem("weatherCity")).name ? JSON.parse(settingsStorage.getItem("weatherCity")).name : '';
  const weatherEnabled = settingsStorage.getItem("enableWeather");
  const updateEvery = JSON.parse(settingsStorage.getItem("updateEvery")).values[0].value;
  
  let weather = {
    enabled: weatherEnabled,
    cityName: cityName,
    temperature: '',
    weatherElements: [],
    fetchTime: '',
    updateEveryMinutes: null,
    error: null
  };

  if (weatherEnabled === 'true' && API_KEY && cityName) {
    console.log("REQUESTED WEATHER");

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
          weather.updateEveryMinutes = updateEvery;
          // Send the weather data to the device          
          messaging.peerSocket.send(weather);
        });
    })
    .catch(function (err) {
      weather.error = "There is an error \n check you weather API key.";
      messaging.peerSocket.send(weather);
    });
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
    default:
      queryOpenWeather();
      break;
  }
}
