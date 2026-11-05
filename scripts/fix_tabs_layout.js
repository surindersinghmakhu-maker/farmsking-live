const fs = require('fs');

const file = 'frontend/app/(user)/(tabs)/_layout.tsx';
let content = fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n');

const target1 = `<View style={desktopStyles.headerLeft}>
            <TouchableOpacity style={desktopStyles.brandLogoBox} activeOpacity={0.8} onPress={() => router.push('/(tabs)' as any)}>
              <BrandLogo size={36} useFastBundledOnly={true} />
              <Text style={desktopStyles.brandTitle}>FarmsKing</Text>
            </TouchableOpacity>
          </View>`;

const replacement1 = `<View style={desktopStyles.headerLeft}>
            <TouchableOpacity
              style={[
                desktopStyles.brandLogoBox,
                isDark && desktopStyles.brandLogoNightPill,
              ]}
              activeOpacity={0.8}
              onPress={() => router.push('/(tabs)' as any)}
            >
              <BrandLogo
                height={36}
                width={124}
                useHdQuality={true}
                dark={isDark}
                resizeMode="contain"
                style={[
                  isDark && Platform.OS === 'web' ? ({
                    filter: 'drop-shadow(0 0 10px rgba(34, 197, 94, 0.4)) drop-shadow(0 2px 8px rgba(0, 0, 0, 0.5))',
                  } as any) : {},
                ]}
              />
            </TouchableOpacity>
          </View>`;

const target2 = `  brandLogoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },`;

const replacement2 = `  brandLogoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandLogoNightPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.09)',
  },`;

if (content.includes(target1)) {
  content = content.replace(target1, replacement1);
  content = content.replace(target2, replacement2);
  fs.writeFileSync(file, content);
  console.log('✅ Successfully updated frontend/app/(user)/(tabs)/_layout.tsx');
} else {
  console.log('❌ target1 not found');
}

