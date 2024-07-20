import { settingsStorage } from "settings";
import { statsIds, tempIds } from "../globals";

export const getIsWeatherConfigured = () => {
  return !!(
    isWeatherEnabled() &&
    (getWeatherCityName().length || isGPSEnabled())
  );
};

export const isGPSEnabled = () => {
  const gpsEnabled = settingsStorage.getItem("gpsEnabled");
  return gpsEnabled === "true";
};

export const isWeatherEnabled = () => {
  const weatherEnabled = settingsStorage.getItem("enableWeather");
  return weatherEnabled === "true";
};

export const getIsHRIconDisabled = () => {
  const hrEnabled = settingsStorage.getItem("disableHRToggle");
  return hrEnabled === "true";
};

export const getWeatherCityName = () => {
  const weatherCitySetting = JSON.parse(settingsStorage.getItem("weatherCity"));
  return weatherCitySetting ? weatherCitySetting.name : "";
};

export const getTemperatureUnit = () => {
  const temperatureUnit = JSON.parse(
    settingsStorage.getItem("temperatureUnit")
  );
  return temperatureUnit ? temperatureUnit.values[0].value : tempIds.c;
};

export const getDistanceUnit = () => {
  const distanceUnit = JSON.parse(settingsStorage.getItem("distanceUnit"));
  return distanceUnit ? distanceUnit.values[0].value : "meters";
};

export const getShowBatteryIndicator = () => {
  const showBatteryIndicator = settingsStorage.getItem("showBatteryIndicator");
  return showBatteryIndicator === "true";
};

export const getAPIKey = () => {
  const weatherApiSetting = JSON.parse(
    settingsStorage.getItem("weatherApiKey")
  );
  return weatherApiSetting ? weatherApiSetting.name : "";
};

export const getUpdateEvery = () => {
  const updateEverySetting = JSON.parse(settingsStorage.getItem("updateEvery"));
  return updateEverySetting ? updateEverySetting.values[0].value : 30;
};

export const getCornerSettings = () => {
  const ltStat = JSON.parse(settingsStorage.getItem("ltStatSel"));
  const rtStat = JSON.parse(settingsStorage.getItem("rtStatSel"));
  const lbStat = JSON.parse(settingsStorage.getItem("lbStatSel"));
  const rbStat = JSON.parse(settingsStorage.getItem("rbStatSel"));

  return {
    ltStat:
      ltStat && ltStat.values.length && !isWeatherEnabled()
        ? ltStat.values[0].value
        : undefined,
    rtStat:
      rtStat && rtStat.values.length ? rtStat.values[0].value : statsIds.steps,
    lbStat: lbStat && lbStat.values.length ? lbStat.values[0].value : undefined,
    rbStat: rbStat && rbStat.values.length ? rbStat.values[0].value : undefined,
  };
};
