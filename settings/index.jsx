import { statsIds, tempIds } from "../globals";

function settingsComponent(props) {
  const weatherEnabled = props.settings.enableWeather === "true";
  const gpsEnabled = props.settings.gpsEnabled === "true";

  return (
    <Page>
      <Section
        title=
        {
          <Text bold align="center">
            Display statistic
          </Text>
        }
      >
        <Select
          settingsKey="ltStatSel"
          label={`Left top: ${weatherEnabled ? 'Weather' : ''}`}
          options={[
            { name: 'Disabled', value: undefined },
            { name: 'Steps', value: statsIds.steps },
            { name: 'Calories', value: statsIds.cals },
            { name: 'Distance', value: statsIds.dist },
            { name: 'Heart rate', value: statsIds.hr },
            { name: 'Active minutes', value: statsIds.azm },
            { name: 'Floors', value: statsIds.floors },
          ]}
          disabled={weatherEnabled}
        />
        <Select
          settingsKey="rtStatSel"
          label="Right top:"
          options={[
            { name: 'Steps (default)', value: statsIds.steps },
            { name: 'Calories', value: statsIds.cals },
            { name: 'Distance', value: statsIds.dist },
            { name: 'Heart rate', value: statsIds.hr },
            { name: 'Active minutes', value: statsIds.azm },
            { name: 'Floors', value: statsIds.floors },
          ]}
        />
        <Select
          settingsKey="lbStatSel"
          label="Left bottom:"
          options={[
            { name: 'Disabled', value: undefined },
            { name: 'Steps', value: statsIds.steps },
            { name: 'Calories', value: statsIds.cals },
            { name: 'Distance', value: statsIds.dist },
            { name: 'Heart rate', value: statsIds.hr },
            { name: 'Active minutes', value: statsIds.azm },
            { name: 'Floors', value: statsIds.floors },
          ]}
        />
        <Select
          settingsKey="rbStatSel"
          label="Right bottom:"
          options={[
            { name: 'Disabled', value: undefined },
            { name: 'Steps', value: statsIds.steps },
            { name: 'Calories', value: statsIds.cals },
            { name: 'Distance', value: statsIds.dist },
            { name: 'Heart rate', value: statsIds.hr },
            { name: 'Active minutes', value: statsIds.azm },
            { name: 'Floors', value: statsIds.floors },
          ]}
        />
        <Toggle
          label="Disable default HR"
          settingsKey="disableHRToggle"
        />
        <Text italic>
            Tap right top statistic to show all stats toast.
        </Text>
      </Section>
      <Section
        title=
        {
          <Text bold align="center">
            Weather
          </Text>
        }
      >
        <Toggle
          label="Enable weather on clock face"
          settingsKey="enableWeather"
        />
        {weatherEnabled && <Section>
          <Text italic>
            To make weather working properly allow Fitbit app on your phone to work in background and disable all battery optimisations for it.
          </Text>
          <Text italic>
            Tap screen to refresh weather.
          </Text>
          <Text italic>
            Tap displayed weather to show details about weather for 5 days.
          </Text>
          <TextInput
            label="OpenWeatherMap Key"
            settingsKey="weatherApiKey"
            disabled={!weatherEnabled}
          />
          <Select
            settingsKey="temperatureUnit"
            label="Temperature unit:"
            options={[
              { name: '°F', value: tempIds.f },
              { name: '°K', value: tempIds.k },
              { name: '°C', value: tempIds.c }
            ]}
            disabled={!weatherEnabled}
          />
          <Toggle
            label="Use GPS"
            settingsKey="gpsEnabled"
            disabled={!weatherEnabled}
          />
          <TextInput
            label="City to fetch (can not specify small town, use GPS)"
            settingsKey="weatherCity"
            disabled={(!weatherEnabled || gpsEnabled)}
          />
          <Select
            settingsKey="updateEvery"
            label="Automatic update weather every:"
            options={[
              { name: '15 min', value: 15 },
              { name: '30 min', value: 30 },
              { name: '60 min', value: 60 }
            ]}
            disabled={!weatherEnabled}
          />
        </Section>}
      </Section>
    </Page>
  );
}

registerSettingsPage(settingsComponent);
