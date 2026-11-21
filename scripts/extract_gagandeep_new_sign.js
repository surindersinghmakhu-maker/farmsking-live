const sharp = require('D:\\farmsking\\backend\\node_modules\\sharp');
const fs = require('fs');
const path = require('path');

const imgPath = 'C:\\Users\\hp\\.gemini\\antigravity\\brain\\d6f7edcb-80b0-4e4d-ac65-524ebca94068\\.user_uploaded\\media_1795279882540_6dc61643.jpg';

sharp(imgPath).metadata().then(meta => {
  console.log('Metadata:', meta.width, 'x', meta.height);
});
