import * as fs from "fs";
import { statsIds } from "../globals";

const SETTINGS_FILE = "settings.txt";

const settingsExist = () => fs.existsSync(SETTINGS_FILE);

export const initializeSettings = () => {
  if (settingsExist()) {
    return;
  }

  const settingsKeys = {
    weatherConfigured: false,
    cornerStats: {
      rtStat: statsIds.steps,
    },
    hrIconEnabled: true,
    distanceUnit: "meters",
  };

  fs.writeFileSync(SETTINGS_FILE, settingsKeys, "json");
  console.log("created");
};

const readSettingsFile = () => {
  if (!settingsExist()) {
    return {};
  }
  const settings_object = fs.readFileSync(SETTINGS_FILE, "json");
  return settings_object;
};

export const updateSettingsFile = (body) => {
  const currentSettings = readSettingsFile();
  const newSettings = {
    ...currentSettings,
    ...body,
  };
  fs.writeFileSync(SETTINGS_FILE, newSettings, "json");
};

export const getSettingFromFile = (key) => {
  const settings_object = readSettingsFile();
  return settings_object[key] ? settings_object[key] : undefined;
};
