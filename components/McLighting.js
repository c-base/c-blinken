const noflo = require('noflo');
const color = require('color');
const mclighting = require('../lib/mclighting');

exports.getComponent = () => {
  const c = new noflo.Component();
  c.icon = 'lightbulb-o';
  c.description = 'Control McLighting lights';
  c.inPorts.add('addresses', {
    datatype: 'array',
    required: true,
    description: 'List of WebSocket addresses of McLighting lights',
  });
  c.inPorts.add('command', {
    datatype: 'string',
    description: 'Send a command to all connected lights',
  });
  c.inPorts.add('store', {
    datatype: 'bang',
    description: 'Fetch and store current state of all connected lights',
  });
  c.inPorts.add('restore', {
    datatype: 'bang',
    description: 'Restore last stored state to all connected lights',
  });
  c.outPorts.add('out', {
    datatype: 'array',
    description: 'Responses to a command from all connected lights',
  });
  c.outPorts.add('error', {
    datatype: 'object',
  });
  c.state = {};
  c.tearDown = (callback) => {
    c.state = {};
    callback();
  };
  c.process((input, output) => {
    if (input.hasData('addresses')) {
      const addresses = input.getData('addresses');
      c.state.modes = [];
      c.state.lights = addresses.map(address => mclighting(address));
      output.sendDone({
        out: c.state.lights.map(() => 'CONNECTING'),
      });
      return;
    }
    if (!c.state.lights || c.state.lights.length < 1) {
      // We need connected lights to process commands
      return;
    }
    if (input.hasData('command')) {
      const command = input.getData('command');
      Promise.all(c.state.lights.map(client => client(command)))
        .then((result) => {
          output.sendDone({
            out: result,
          });
        }, (err) => {
          output.done(err);
        });
      return;
    }
    if (input.hasData('store')) {
      input.getData('store');
      c.state.modes = [];
      Promise.all(c.state.lights.map((client, idx) => client('$')
        .then((result) => {
          c.state.modes[idx] = JSON.parse(result);
          return result;
        })))
        .then((result) => {
          output.sendDone({
            out: result,
          });
        }, (err) => {
          output.done(err);
        });
      return;
    }
    if (input.hasData('restore')) {
      input.getData('restore');
      if (!c.state.modes.length) {
        output.done(new Error('No stored modes to restore'));
        return;
      }
      Promise.all(c.state.lights.map((client, idx) => {
        const state = c.state.modes[idx];
        if (!state) {
          return Promise.resolve('NO STATE');
        }
        return client(color.rgb(state.color).hex())
          .then(() => client(`?${state.delay_ms}`))
          .then(() => client(`%${state.brightness}`))
          .then(() => client(`/${state.mode}`));
      }))
        .then((result) => {
          output.sendDone({
            out: result,
          });
        }, (err) => {
          output.done(err);
        });
    }
  });
  return c;
};
