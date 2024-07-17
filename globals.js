export const IONIC_MODEL_NUMBER = "27";
export const VERSA_LITE_MODEL_NUMBER = "38";

export const monthNames = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export const daysNames = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export const statsIds = {
  steps: "steps",
  cals: "cals",
  dist: "dist",
  hr: "hr",
  azm: "azm",
  floors: "floors",
};

export const tempIds = {
  f: "f",
  k: "k",
  c: "c",
};

export const appCommands = {
  todayWeather: "a_todayWeather",
  forecastWeather: "a_forecastWeather",
  statsSettings: "a_statsSettings",
  weatherConfigured: "a_weatherConfigured",
  settingsChanged: "a_settingsChanged",
  disableHRSetting: "a_disableHRSetting",
};

export const companionCommands = {
  todayWeather: "c_todayWeather",
  forecastWeather: "c_forecastWeather",
  statsSettings: "c_statsSettings",
  weatherConfigured: "c_weatherConfigured",
  settingsChanged: "c_settingsChanged",
  disableHRSetting: "c_disableHRSetting",
};

export const errorMessages = {
  fetch:
    "Cannot fetch weather. Check your weather API key and Internet connection.",
  wrongApiKey: "Invalid weather API key",
  apiLimit: "You reached API limit",
  weatherUnknown: "Unknown weather server error",
  gpsFail: "Failed to use gps",
  closedSocket: "Communication problem. Open Fitbit app on your phone.",
};
