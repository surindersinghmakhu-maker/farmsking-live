const sharp = require('D:\\farmsking\\backend\\node_modules\\sharp');
const fs = require('fs');
const path = require('path');

const imgPath = 'C:\\Users\\hp\\.gemini\\antigravity\\brain\\d6f7edcb-80b0-4e4d-ac65-524ebca94068\\.user_uploaded\\media_1795279882540_6dc61643.jpg';

async function cropTest() {
  // Let's crop a broad area around employer 1
  await sharp(imgPath)
    .extract({ left: 30, top: 280, width: 280, height: 200 })
    .toFile('D:\\farmsking\\Govt\\docs\\00_Directors_Official_Signatures\\test_crop_area.png');
  console.log('Saved test crop area');
}
cropTest();
