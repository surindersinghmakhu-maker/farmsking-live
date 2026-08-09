import { Platform } from 'react-native';

// Android emulators can't reach the host machine via "localhost" - 10.0.2.2 is the
// standard alias Android provides for that. Physical devices need the machine's LAN IP
// instead (set EXPO_PUBLIC_API_URL to override, e.g. http://192.168.1.20:4100/api/v1).
const DEV_HOST = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';

export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? `http://${DEV_HOST}:4100/api/v1`;
