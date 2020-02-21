function settingsComponent(props) {
  return (
    <Page>
      <Section
        title=
        {
          <Text bold align="center">
            Weather
          </Text>
        }
      >
        <Text>
          For working weather properly allow Fitbit app on your phone to work in background.
        </Text>
        <Text>
          Tap screen to refresh weather.
        </Text>
        <Text>
          Tap displayed weather to show details about weather for 5 days.
        </Text>
        <Toggle
          label="Enable weather on clock face"
          settingsKey="enableWeather"
        />
        <TextInput
          label="OpenWeatherMap Key"
          settingsKey="weatherApiKey"
          disabled={!(props.settings.enableWeather === "true")}
        />
        <Toggle
          label="Use GPS"
          settingsKey="gpsEnabled"
          disabled={!(props.settings.enableWeather === "true")}
        />
        <TextInput
          label="City to fetch (can not specify small town, use GPS)"
          settingsKey="weatherCity"
          disabled={(!(props.settings.enableWeather === "true") || props.settings.gpsEnabled === "true")}
        />
        <Select
          settingsKey="updateEvery"
          label="Automatic update weather every:"
          options={[
            { name: '15 min', value: 15 },
            { name: '30 min',  value: 30 },
            { name: '60 min',value: 60 }
          ]}
          disabled={!(props.settings.enableWeather === "true")}
        />
      </Section>
    </Page>
  );
}

registerSettingsPage(settingsComponent);
