const path = require('path');
const { createTurboStaticServer } = require('./create-turbo-server');

createTurboStaticServer({
  name: 'Admin Portal',
  port: parseInt(process.env.PORT || '8082', 10),
  dir: path.resolve(__dirname, '../admin/dist'),
});
