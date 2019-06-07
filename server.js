/**
 * Updated version of
 * https://gist.github.com/DurandA/4396348a733bc784bd93266d4a2ac117 for
 * exposing the Thingy:52 as a Web Thing
 */

const {
  Event,
  Property,
  SingleThing,
  Thing,
  Value,
  WebThingServer,
} = require('webthing');
const Thingy = require('thingy52');
const Color = require('color');

console.log('Scanning for Thingy:52');

function run_server(thingy) {
  console.log('Discovered:', thingy.address);

  thingy.on('disconnect', () => {
    console.log('Disconnected!');
  });

  const thing = new Thing(
    'thingy:52',
    ['ColorControl', 'PushButton'],
    'A WoT-connected Thingy:52'
  );

  const temperatureProperty = new Property(
    thing,
    'temperature',
    new Value(0),
    {
      type: 'number',
      unit: 'degree celsius',
      label: 'Temperature',
      description: 'An ambient temperature sensor',
      readOnly: true,
    }
  );
  thing.addProperty(temperatureProperty);

  const pressureProperty = new Property(
    thing,
    'pressure',
    new Value(0),
    {
      type: 'number',
      label: 'Pressure',
      unit: 'hectopascal',
      readOnly: true,
    }
  );
  thing.addProperty(pressureProperty);

  const humidityProperty = new Property(
    thing,
    'humidity',
    new Value(0),
    {
      type: 'number',
      label: 'Humidity',
      unit: 'percent',
      readOnly: true,
    }
  );
  thing.addProperty(humidityProperty);

  const eco2Property = new Property(
    thing,
    'eco2',
    new Value(0),
    {
      type: 'number',
      unit: 'ppm',
      label: 'ECO2',
      description: 'Effective CO2',
      readOnly: true,
    }
  );
  thing.addProperty(eco2Property);

  const tvocProperty = new Property(
    thing,
    'tvoc',
    new Value(0),
    {
      type: 'number',
      unit: 'ppb',
      label: 'TVOC',
      description: 'Total volatile organic compound',
      readOnly: true,
    }
  );
  thing.addProperty(tvocProperty);

  const luminosityProperty = new Property(
    thing,
    'luminosity',
    new Value(0),
    {
      type: 'number',
      unit: 'lux',
      label: 'Luminosity',
      readOnly: true,
    }
  );
  thing.addProperty(luminosityProperty);

  const batteryLevelProperty = new Property(
    thing,
    'battery',
    new Value(0),
    {
      type: 'number',
      unit: 'percent',
      label: 'Battery',
      readOnly: true,
    }
  );
  thing.addProperty(batteryLevelProperty);

  const ledColorProperty = new Property(
    thing,
    'ledColor',
    new Value('#0000FF', (value) => {
      const color = Color(value);
      console.log('trying to set color:', value, color);
      thingy.led_set(color.object(), (error) => {
        if (error) {
          console.log('Failed to set LED color:', error);
        }
      });
    }),
    {
      '@type': 'ColorProperty',
      type: 'string',
      label: 'LED Color',
    }
  );
  thing.addProperty(ledColorProperty);

  const sensorColorProperty = new Property(
    thing,
    'sensorColor',
    new Value('#000000'),
    {
      '@type': 'ColorProperty',
      type: 'string',
      label: 'Sensed Color',
      readOnly: true,
    }
  );
  thing.addProperty(sensorColorProperty);

  const buttonProperty = new Property(
    thing,
    'button',
    new Value(false),
    {
      '@type': 'PushedProperty',
      type: 'boolean',
      label: 'Button',
    }
  );
  thing.addProperty(buttonProperty);
  thing.addAvailableEvent(
    'pressed',
    {
      description: 'Button pressed',
      '@type': 'PressedEvent',
    }
  );

  thingy.connectAndSetUp((error) => {
    if (error) {
      console.log('Failed to connect:', error);
      return;
    }

    console.log('Connected!');

    thingy.on('temperatureNotif', (value) => {
      temperatureProperty.value.notifyOfExternalUpdate(value);
    });
    thingy.on('pressureNotif', (value) => {
      pressureProperty.value.notifyOfExternalUpdate(value);
    });
    thingy.on('humidityNotif', (value) => {
      humidityProperty.value.notifyOfExternalUpdate(value);
    });
    thingy.on('gasNotif', (value) => {
      eco2Property.value.notifyOfExternalUpdate(value.eco2);
      tvocProperty.value.notifyOfExternalUpdate(value.tvoc);
    });
    thingy.on('colorNotif', (value) => {
      // eslint-disable-next-line max-len
      // https://github.com/NordicPlayground/Nordic-Thingy52-Thingyjs/blob/master/js/ColorSensor.js
      const r = value.red;
      const g = value.green;
      const b = value.blue;
      const c = value.clear;
      const rRatio = r / (r + g + b);
      const gRatio = g / (r + g + b);
      const bRatio = b / (r + g + b);
      const clearAtBlack = 300;
      const clearAtWhite = 400;
      const clearDiff = clearAtWhite - clearAtBlack;
      const clearNormalized = Math.max((c - clearAtBlack) / clearDiff, 0);

      const red = Math.min(rRatio * 255.0 * 3 * clearNormalized, 255);
      const green = Math.min(gRatio * 255.0 * 3 * clearNormalized, 255);
      const blue = Math.min(bRatio * 255.0 * 3 * clearNormalized, 255);

      const color = Color({
        r: red.toFixed(0),
        g: green.toFixed(0),
        b: blue.toFixed(0),
      });

      sensorColorProperty.value.notifyOfExternalUpdate(color.hex());
      luminosityProperty.value.notifyOfExternalUpdate(value.clear);
    });
    thingy.on('batteryLevelChange', (value) => {
      batteryLevelProperty.value.notifyOfExternalUpdate(value);
    });
    thingy.on('buttonNotif', (state) => {
      buttonProperty.value.notifyOfExternalUpdate(state === 'Pressed');
      thing.addEvent(new Event(thing, 'pressed'));
    });

    thingy.temperature_interval_set(1000, (error) => {
      if (error) {
        console.log('Failed to configure temperature sensor:', error);
      }
    });
    thingy.pressure_interval_set(1000, (error) => {
      if (error) {
        console.log('Failed to configure pressure sensor:', error);
      }
    });
    thingy.humidity_interval_set(1000, (error) => {
      if (error) {
        console.log('Failed to configure humidity sensor:', error);
      }
    });
    thingy.color_interval_set(1000, (error) => {
      if (error) {
        console.log('Failed to configure color sensor:', error);
      }
    });
    thingy.gas_mode_set(1, (error) => {
      if (error) {
        console.log('Failed to configure gas sensor:', error);
      }
    });

    thingy.temperature_enable((error) => {
      if (error) {
        console.log('Failed to enable temperature sensor:', error);
      }
    });
    thingy.pressure_enable((error) => {
      if (error) {
        console.log('Failed to enable pressure sensor:', error);
      }
    });
    thingy.humidity_enable((error) => {
      if (error) {
        console.log('Failed to enable humidity sensor:', error);
      }
    });
    thingy.color_enable((error) => {
      if (error) {
        console.log('Failed to enable color sensor:', error);
      }
    });
    thingy.gas_enable((error) => {
      if (error) {
        console.log('Failed to enable gas sensor:', error);
      }
    });
    thingy.button_enable((error) => {
      if (error) {
        console.log('Failed to enable button:', error);
      }
    });
    thingy.notifyBatteryLevel((error) => {
      if (error) {
        console.log('Failed to enable battery level notifications:', error);
      }
    });
  });

  const server = new WebThingServer(new SingleThing(thing), 8888);
  server.start().catch(console.error);
}

Thingy.discover(run_server);
