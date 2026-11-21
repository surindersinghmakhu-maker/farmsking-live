const sharp = require('D:\\farmsking\\backend\\node_modules\\sharp');

async function measureSigns() {
  const imgPath = 'C:\\Users\\hp\\.gemini\\antigravity\\brain\\d6f7edcb-80b0-4e4d-ac65-524ebca94068\\.user_uploaded\\media_1795279882540_6dc61643.jpg';

  // Let's crop a box from x=45 to x=215, y=330 to y=435 (all 3 signatures without numbers)
  await sharp(imgPath)
    .extract({ left: 45, top: 330, width: 170, height: 105 })
    .toFile('D:\\farmsking\\Govt\\docs\\00_Directors_Official_Signatures\\all_3_gk_signs.png');

  console.log('Saved all 3 signs cropped without numbers');
}
measureSigns();
