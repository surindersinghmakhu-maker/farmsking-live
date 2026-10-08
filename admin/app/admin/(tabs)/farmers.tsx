import { Pressable } from 'react-native';
import { Redirect } from 'expo-router';

const Hoverable4DCard = ({ children, style, onPress }: any) => {
  return (
    <Pressable onPress={onPress} style={({ hovered, pressed }: any) => [
      style,
      hovered && {
        borderColor: 'rgba(0,255,135,0.55)',
        shadowColor: '#00ff87',
        shadowOpacity: 0.3,
        shadowRadius: 15,
        elevation: 10,
        transform: [{ scale: 1.02 }]
      },
      pressed && { opacity: 0.8, transform: [{ scale: 0.98 }] }
    ]}>
      {children}
    </Pressable>
  );
};

export default function Dummy() {
  return <Redirect href="/admin/(tabs)/super-users" />;
}
