const noflo = require('noflo');
const path = require('path');

exports.getComponent = () => {
  const c = new noflo.Component();
  c.icon = 'folder';
  c.inPorts.add('in', {
    datatype: 'string',
  });
  c.outPorts.add('out', {
    datatype: 'string',
  });
  c.process((input, output) => {
    if (!input.hasData('in')) {
      return;
    }
    const filename = input.getData('in');
    output.sendDone({
      out: path.resolve(__dirname, `../animations/${filename}.yml`),
    });
  });
  return c;
};
