import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { RecoilRoot } from 'recoil';

export default function RootLayout() {
  return (
    <RecoilRoot>
      <StatusBar style="light" backgroundColor="#000000" />
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: '#000000',
          },
          headerTintColor: '#ffffff',
          headerTitleStyle: {
            fontWeight: '600',
          },
          headerShadowVisible: false,
        }}
      >
        <Stack.Screen
          name="index"
          options={{
            title: 'Lottery',
            headerShown: false
          }}
        />
        <Stack.Screen
          name="history"
          options={{
            title: 'History',
            presentation: 'modal'
          }}
        />
      </Stack>
    </RecoilRoot>
  );
}
