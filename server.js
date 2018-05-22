/**
 * Updated version of
 * https://gist.github.com/DurandA/4396348a733bc784bd93266d4a2ac117 for
 * exposing the Thingy:52 as a Web Thing
 */

const {Action, Event, Property, Thing, Value, WebThingServer} = require('webthing');
const uuidv4 = require('uuid/v4');
var Thingy = require('thingy52');
var Color = require('color');

console.log('Reading Thingy environment sensors!');


class ButtonEvent extends Event {
  constructor(thing, state) {
    super(thing, state, 'Button' + state);
  }
}

class LedColorProperty extends Property {
  constructor(thing, thingy) {
    super(thing, 'color', new Value('#00f', () => {}), {type: 'string'});
    this.thingy = thingy;
  }

}

function run_server(thingy) {
  console.log('Discovered: ' + thingy);

  thingy.on('disconnect', function() {
    console.log('Disconnected!');
  });

  const thing = new Thing('WoT Thingy', 'thing', 'A WoT-connected Thingy:52');

  let temperatureProperty = new Property(thing,
                                         'temperature',
                                         new Value(0, () => {}),
                                         {type: 'number',
                                          unit: 'celsius',
                                          description: 'An ambient temperature sensor'});
  thing.addProperty(temperatureProperty);
  let pressureProperty = new Property(thing,
                                      'pressure',
                                      new Value(0, () => {}),
                                      {type: 'number',
                                       unit: 'hectopascal'});
  thing.addProperty(pressureProperty);
  let humidityProperty = new Property(thing,
                                      'humidity',
                                      new Value(0, () => {}),
                                      {type: 'number',
                                       unit: 'percent'});
  thing.addProperty(humidityProperty);
  let gasProperty = new Property(thing,
                                'gas',
                                new Value({}, () => {}),
                                {type: 'object'});
  thing.addProperty(gasProperty);

  let luminosityProperty = new Property(thing,
                                        'luminosity',
                                        new Value(0, () => {}),
                                        {type: 'number',
                                         unit: 'lux'});
  thing.addProperty(luminosityProperty);

  let batteryLevelProperty = new Property(thing,
                                          'battery',
                                          new Value(0, () => {}),
                                          {type: 'number',
                                           unit: 'percent'});
  thing.addProperty(batteryLevelProperty);

  let colorProperty = new Property(thing, 'color', new Value('#00f', (value) => {
    let color = Color(value);
    this.thingy.led_set(color.object(), function(error) {
      console.log('LED color changed ' + ((error) ? error : ''));
    });
  }), {type: 'string'});
  thing.addProperty(colorProperty);

  console.log('setup');

  thingy.connectAndSetUp(function(error) {
    console.log('Connected! ' + error ? error : '');

    thingy.on('temperatureNotif', temperatureProperty.setValue.bind(temperatureProperty));
    thingy.on('pressureNotif', pressureProperty.setValue.bind(pressureProperty));
    thingy.on('humidityNotif', humidityProperty.setValue.bind(humidityProperty));
    thingy.on('gasNotif', gasProperty.setValue.bind(gasProperty));
    thingy.on('colorNotif', value => {
      let color = Color({r: value.red,
                         g: value.green,
                         b: value.blue});
      colorProperty.setValue(value.hex());
      luminosityProperty.setValue(value['clear']);
    });

    thingy.on('batteryLevelChange', batteryLevelProperty.setValue.bind(batteryLevelProperty));

    thingy.on('buttonNotif', state => thing.addEvent(new ButtonEvent(thing, state)));

    thingy.temperature_interval_set(1000, function(error) {
      if (error) {
        console.log('Temperature sensor configure! ' + error);
      }
    });
    thingy.pressure_interval_set(1000, function(error) {
      if (error) {
        console.log('Pressure sensor configure! ' + error);
      }
    });
    thingy.humidity_interval_set(1000, function(error) {
      if (error) {
        console.log('Humidity sensor configure! ' + error);
      }
    });
    thingy.color_interval_set(1000, function(error) {
      if (error) {
        console.log('Color sensor configure! ' + error);
      }
    });
    thingy.gas_mode_set(1, function(error) {
      if (error) {
        console.log('Gas sensor configure! ' + error);
      }
    });

    thingy.temperature_enable(function(error) {
      console.log('Temperature sensor started! ' + ((error) ? error : ''));
    });
    thingy.pressure_enable(function(error) {
      console.log('Pressure sensor started! ' + ((error) ? error : ''));
    });
    thingy.humidity_enable(function(error) {
      console.log('Humidity sensor started! ' + ((error) ? error : ''));
    });
    thingy.color_enable(function(error) {
      console.log('Color sensor started! ' + ((error) ? error : ''));
    });
    thingy.gas_enable(function(error) {
      console.log('Gas sensor started! ' + ((error) ? error : ''));
    });
    thingy.button_enable(function(error) {
      console.log('Button started! ' + ((error) ? error : ''));
    });
    thingy.notifyBatteryLevel(function(error) {
      console.log('Battery Level Notifications enabled! ' + ((error) ? error : ''));
    });
  });

  thing.addAvailableEvent('pressed', {
    description: 'Button pressed'
  });
  thing.addAvailableEvent('released', {
    description: 'Button released'
  });

  const server = new WebThingServer(thing, 'thingy52', 8888);
  server.start();
}

Thingy.discover(run_server);
