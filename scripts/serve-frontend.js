const path = require('path');
const { createTurboStaticServer } = require('./create-turbo-server');

createTurboStaticServer({
  name: 'Frontend Web',
  port: parseInt(process.env.PORT || '8081', 10),
  dir: path.resolve(__dirname, '../frontend/dist'),
});
