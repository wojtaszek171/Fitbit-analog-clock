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
        <Toggle
          label="Enable weather on clock face"
          settingsKey="enableWeather"
        />
        <TextInput
          label="OpenWeatherMap Key"
          settingsKey="weatherApiKey"
          disabled={!(props.settings.enableWeather === "true")}
        />
        <TextInput
          label="City to fetch (can not specify small town, use GPS)"
          settingsKey="weatherCity"
          disabled={!(props.settings.enableWeather === "true")}
        />
      </Section>
    </Page>
  );
}

registerSettingsPage(settingsComponent);
