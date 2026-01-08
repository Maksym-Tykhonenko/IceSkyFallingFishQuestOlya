import React, { useEffect, useMemo } from 'react';
import { View, StyleSheet, ImageBackground, Image, Platform, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { WebView } from 'react-native-webview';

type Props = NativeStackScreenProps<RootStackParamList, 'Loader'>;

const BG = require('../assets/background.png');
const LOGO = require('../assets/logo.png');

export default function LoaderScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();

  const IS_TINY = height < 680;
  const IS_SMALL = height < 750;

  useEffect(() => {
    const t = setTimeout(() => navigation.replace('Onboarding'), 1800);
    return () => clearTimeout(t);
  }, [navigation]);

  const html = useMemo(() => {
    return `
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <style>
            html, body {
              margin:0; padding:0; width:100%; height:100%;
              background: transparent;
              overflow:hidden;
            }
            .stage{
              width:100%; height:100%;
              display:flex; align-items:center; justify-content:center;
              background: transparent;
            }
            .mark{
              position: relative;
              width: 92px;
              height: 46px;
              display:flex;
              align-items:flex-end;
              justify-content:center;
              gap: 8px;
              transform: translateY(2px);
            }
            .bar{
              width: 10px;
              border-radius: 2px;
              background: rgba(0,0,0,0.92);
              transform-origin: bottom;
              animation: pulse 950ms ease-in-out infinite;
            }
            .b1{ height: 10px; opacity: 0.55; animation-delay: 0ms; }
            .b2{ height: 18px; opacity: 0.70; animation-delay: 90ms; }
            .b3{ height: 26px; opacity: 0.82; animation-delay: 180ms; }
            .b4{ height: 34px; opacity: 0.95; animation-delay: 270ms; }
            .dot{
              position:absolute;
              left: 18px;
              top: -6px;
              width: 10px;
              height: 10px;
              border-radius: 999px;
              background: #3B82F6;
              box-shadow: 0 0 0 6px rgba(59,130,246,0.18);
              animation: floaty 950ms ease-in-out infinite;
            }
            @keyframes pulse{
              0%,100% { transform: scaleY(1); }
              50% { transform: scaleY(0.78); }
            }
            @keyframes floaty{
              0%,100% { transform: translateY(0); opacity: 1; }
              50% { transform: translateY(4px); opacity: 0.9; }
            }
          </style>
        </head>
        <body>
          <div class="stage">
            <div class="mark">
              <div class="dot"></div>
              <div class="bar b1"></div>
              <div class="bar b2"></div>
              <div class="bar b3"></div>
              <div class="bar b4"></div>
            </div>
          </div>
        </body>
      </html>
    `;
  }, []);

  const logoW = Math.min(width * 0.58, IS_TINY ? 210 : IS_SMALL ? 235 : 260);
  const logoH = logoW * 0.42;

  const webW = Math.min(width * 0.82, 340);
  const webH = IS_TINY ? 88 : IS_SMALL ? 104 : 118;

  return (
    <ImageBackground source={BG} style={styles.bg} resizeMode="cover">
      <View style={{ alignItems: 'center', paddingTop: insets.top + (IS_TINY ? 64 : 80) }}>
        <Image source={LOGO} style={{ width: logoW, height: logoH }} resizeMode="contain" />
      </View>

      <View style={[styles.bottom, { paddingBottom: insets.bottom + (IS_TINY ? 28 : 40) }]}>
        <View style={[styles.webCard, { width: webW, height: webH }]}>
          <WebView
            originWhitelist={['*']}
            source={{ html }}
            style={styles.web}
            containerStyle={styles.web}
            javaScriptEnabled
            domStorageEnabled
            scrollEnabled={false}
            bounces={false}
            showsVerticalScrollIndicator={false}
            showsHorizontalScrollIndicator={false}
            overScrollMode="never"
            androidLayerType={Platform.OS === 'android' ? 'hardware' : undefined}
          />
        </View>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1 },
  bottom: { flex: 1, justifyContent: 'flex-end', alignItems: 'center' },
  webCard: {
    borderRadius: 22,
    overflow: 'hidden',
    backgroundColor: 'transparent',
  },
  web: { flex: 1, backgroundColor: 'transparent' },
});
