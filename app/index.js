import clock from "clock";
import document from "document";
import * as messaging from "messaging";
import { HeartRateSensor } from "heart-rate";
import { BodyPresenceSensor } from "body-presence";
import { display } from "display";
import { today } from 'user-activity';

const monthNames = ["January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const weatherInterval = null;

// Update the clock every second
clock.granularity = "seconds";

let hourHand = document.getElementById("hours");
let minHand = document.getElementById("mins");
let secHand = document.getElementById("secs");
let heartRateText = document.getElementById("heartratetext");
let dateText = document.getElementById("dateText");

// Returns an angle (0-360) for the current hour in the day, including minutes
function hoursToAngle(hours, minutes) {
  let hourAngle = (360 / 12) * hours;
  let minAngle = (360 / 12 / 60) * minutes;
  return hourAngle + minAngle;
}

// Request weather data from the companion
function fetchWeather() {
  if (messaging.peerSocket.readyState === messaging.peerSocket.OPEN) {
    messaging.peerSocket.send({
      command: 'weather'
    });
  }
}

// Returns an angle (0-360) for minutes
function minutesToAngle(minutes) {
  return (360 / 60) * minutes;
}

// Returns an angle (0-360) for seconds
function secondsToAngle(seconds) {
  return (360 / 60) * seconds;
}

// Rotate the hands every tick
function updateClock() {
  let todayDate = new Date();
  let hours = todayDate.getHours() % 12;
  let mins = todayDate.getMinutes();
  let secs = todayDate.getSeconds();
  let stepsText = document.getElementById("stepstext");

  hourHand.groupTransform.rotate.angle = hoursToAngle(hours, mins);
  minHand.groupTransform.rotate.angle = minutesToAngle(mins);
  secHand.groupTransform.rotate.angle = secondsToAngle(secs);

  stepsText.text = today.adjusted.steps;
  dateText.text = todayDate.getDate() + " " + monthNames[todayDate.getMonth()].substring(0, 3);
}

// Display the weather data received from the companion
function processWeatherData(data) {
  const enabled = data.enabled;
  const updateMinutes = data.updateEveryMinutes ? data.updateEveryMinutes : 30;  
  const img = document.getElementById("weatherIcon");
  const cityname = document.getElementById("cityname");
  const degrees = document.getElementById("degrees");
  
  if (enabled === 'true') {
    const el = data.weatherElements[0];
    cityname.text = data.cityName;
    img.href = "weatherimages/"+el.icon+".png";
    degrees.text = Math.round(data.temperature) + "°";
    
    // Fetch the weather every 30 minutes
    if(weatherInterval !== null) {
      clearInterval(weatherInterval);
    }
    weatherInterval = setInterval(fetchWeather, Number(updateMinutes) * 1000 * 60);
  } else {
    cityname.text = '';
    img.href = '';
    degrees.text = '';
  }
}

// Update the clock every tick event
clock.ontick = () => updateClock();

// Listen for the onopen event
messaging.peerSocket.onopen = function() {
  fetchWeather();
}

// Listen for messages from the companion
messaging.peerSocket.onmessage = function(evt) {
  if (evt.data)  {
    processWeatherData(evt.data);
  }
}

// Listen for the onerror event
messaging.peerSocket.onerror = function(err) {
  console.log("Connection error: " + err.code + " - " + err.message);
}

const hrm = null;

if (HeartRateSensor) {
  hrm = new HeartRateSensor();
  hrm.addEventListener("reading", () => {
    heartRateText.text = hrm.heartRate;
  });
  hrm.start();
}

const bodyPresence = null;

if (BodyPresenceSensor) {
  bodyPresence = new BodyPresenceSensor();
  bodyPresence.addEventListener("reading", () => {
    if (!bodyPresence.present) {
      heartRateText.text = "--";
      hrm.stop();
    } else {
      hrm.start();
    }
  });
  bodyPresence.start();
}


//AOD setting
if (display.aodAvailable) {
  // tell the system we support AOD
  display.aodAllowed = true;

  const weatherSection = document.getElementById("weather");
  const heartRateSection = document.getElementById("heartRate");
  const stepsSection = document.getElementById("steps");
  const minutesLayer = document.getElementById("minutesLayer");
  const dateLayer = document.getElementById("todayDate");

  // respond to display change events
  display.addEventListener("change", () => {
    // Is AOD inactive and the display is on?
    if (!display.aodActive && display.on) {
      clock.granularity = "seconds";
      secHand.style.display = "inline";
      weatherSection.style.display = "inline";
      heartRateSection.style.display = "inline";
      stepsSection.style.display = "inline";
      minutesLayer.style.display = "inline";
      dateLayer.style.display = "inline";
      hrm.start();
      bodyPresence.start();
    } else {
      clock.granularity = "minutes";
      secHand.style.display = "none";
      weatherSection.style.display = "none";
      heartRateSection.style.display = "none";
      stepsSection.style.display = "none";
      minutesLayer.style.display = "none";
      dateLayer.style.display = "none";
      hrm.stop();
      bodyPresence.stop();
    }
  });
}
