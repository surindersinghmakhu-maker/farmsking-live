const fs = require('fs');

['frontend/components/dashboards/RoleHeader.tsx', 'admin/components/dashboards/RoleHeader.tsx'].forEach(file => {
  if (fs.existsSync(file)) {
    let c = fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n');
    const oldRowRegex = /<View style={styles\.brandRow}>[\s\S]*?<\/View>/;
    const newRow = `<View style={styles.brandRow}>
            <BrandLogo
              height={30}
              width={104}
              useHdQuality={true}
              dark={true}
              resizeMode="contain"
            />
          </View>`;
    if (c.includes('brandNameText')) {
      c = c.replace(oldRowRegex, newRow);
      fs.writeFileSync(file, c);
      console.log('✅ Updated brandRow in', file);
    }
  }
});

