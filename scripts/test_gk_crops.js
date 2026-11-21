const sharp = require('D:\\farmsking\\backend\\node_modules\\sharp');

async function testSignatures() {
  const imgPath = 'C:\\Users\\hp\\.gemini\\antigravity\\brain\\d6f7edcb-80b0-4e4d-ac65-524ebca94068\\.user_uploaded\\media_1795279882540_6dc61643.jpg';

  // Signature 1
  await sharp(imgPath)
    .extract({ left: 45, top: 335, width: 175, height: 40 })
    .toFile('D:\\farmsking\\Govt\\docs\\00_Directors_Official_Signatures\\raw_gk_new_1.png');

  // Signature 2
  await sharp(imgPath)
    .extract({ left: 45, top: 365, width: 175, height: 40 })
    .toFile('D:\\farmsking\\Govt\\docs\\00_Directors_Official_Signatures\\raw_gk_new_2.png');

  // Signature 3
  await sharp(imgPath)
    .extract({ left: 45, top: 395, width: 175, height: 45 })
    .toFile('D:\\farmsking\\Govt\\docs\\00_Directors_Official_Signatures\\raw_gk_new_3.png');

  console.log('Saved raw crops 1, 2, 3');
}
testSignatures();
