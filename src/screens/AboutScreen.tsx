import React, { useCallback, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Image,
  ImageBackground,
  useWindowDimensions,
  Platform,
  Share,
  BackHandler,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { useFocusEffect } from '@react-navigation/native';

type Props = NativeStackScreenProps<RootStackParamList, 'About'>;
const BG = require('../assets/background.png');
const BTN_PROGRESS = require('../assets/btn_progres.png');
const BTN_SKIP = require('../assets/btn_skip.png');
const ICON_BACK = require('../assets/icon_back.png');
const LOGO = require('../assets/logo.png');
const ABOUT_APP_ICON = require('../assets/logo.png');
const ABOUT_TEXT_CARD = require('../assets/progress_panel.png');
const BTN_SHARE_ICE = require('../assets/btn_progres.png');

export default function AboutScreen({ navigation }: Props) {
  const { width: W, height: H } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  useEffect(() => {
    navigation.setOptions?.({ gestureEnabled: false });
  }, [navigation]);

  useFocusEffect(
    useCallback(() => {
      const sub = BackHandler.addEventListener('hardwareBackPress', () => true);
      return () => sub.remove();
    }, [])
  );

  const safeH = Math.max(1, H - insets.top - insets.bottom);
  const IS_TINY = safeH < 700;

  const s = useMemo(() => {
    const base = safeH / 812;
    return Math.max(0.74, Math.min(1.05, base));
  }, [safeH]);

  const topPad = insets.top + 30;

  const headH = 56 * s;
  const sideSize = Math.min(W * 0.14, 64) * (IS_TINY ? 0.88 : 1) * s;
  const centerW = Math.min(W * 0.56, 260) * s;
  const centerH = Math.max(44 * s, headH * 0.78);
  const blockW = Math.min(W * 0.92, 430);
  const logoRadius = (sideSize * 0.78) / 2;
  const bigIcon = Math.min(W * 0.70, 320) * s;
  const bigIconTop = (IS_TINY ? 10 : 16) * s;
  const cardW = Math.min(W * 0.88, 380) * s;
  const cardH = (IS_TINY ? 230 : 255) * s;
  const aboutFont = (IS_TINY ? 12.2 : 13.0) * s;
  const aboutLine = aboutFont * 1.18;
  const paraGap = (IS_TINY ? 7 : 9) * s;
  const shareW = Math.min(W * 0.46, 200) * s;
  const shareH = Math.min(W * 0.18, 72) * s;

  const onShare = async () => {
    try {
      await Share.share({
        message:
          'Ice Sky Falling Fish — relaxing falling-cube puzzle. Catch icy fish cubes from the sky and enjoy a calm ice-fishing atmosphere!',
      });
    } catch {
    }
  };

  return (
    <ImageBackground source={BG} style={styles.bg} resizeMode="cover">
      <View style={[styles.wrap, { paddingTop: topPad, paddingBottom: insets.bottom + (IS_TINY ? 10 : 16) }]}>
        <View style={[styles.headerRow, { height: headH, width: blockW }]}>
          <Pressable
            onPress={() => navigation.goBack()}
            hitSlop={10}
            android_ripple={Platform.OS === 'android' ? { color: 'rgba(255,255,255,0.12)', borderless: true } : undefined}
          >
            <ImageBackground source={BTN_SKIP} style={{ width: sideSize, height: sideSize }} resizeMode="contain">
              <View style={styles.center}>
                <Image source={ICON_BACK} style={{ width: sideSize * 0.42, height: sideSize * 0.42 }} resizeMode="contain" />
              </View>
            </ImageBackground>
          </Pressable>

          <ImageBackground source={BTN_PROGRESS} style={{ width: centerW, height: centerH }} resizeMode="contain">
            <View style={styles.center}>
              <Text style={[styles.headTitle, { fontSize: 18 * s }]}>About</Text>
            </View>
          </ImageBackground>

          <View style={{ width: sideSize, height: sideSize }}>
            <ImageBackground source={BTN_SKIP} style={{ width: sideSize, height: sideSize }} resizeMode="contain">
              <View style={styles.center}>
                <View
                  style={{
                    width: sideSize * 0.78,
                    height: sideSize * 0.78,
                    borderRadius: logoRadius,
                    overflow: 'hidden',
                  }}
                >
                  <Image source={LOGO} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                </View>
              </View>
            </ImageBackground>
          </View>
        </View>

        <View style={{ height: bigIconTop }} />

        <View style={{ alignItems: 'center' }}>
          <Image
            source={ABOUT_APP_ICON}
            style={{
              width: bigIcon,
              height: bigIcon,
              borderRadius: 22 * s,
            }}
            resizeMode="cover"
          />
        </View>

        <View style={{ height: (IS_TINY ? 14 : 18) * s }} />

        <View style={{ alignItems: 'center' }}>
          <ImageBackground source={ABOUT_TEXT_CARD} style={{ width: cardW, height: cardH }} resizeMode="contain">
            <View
              style={{
                flex: 1,
                justifyContent: 'center',
                alignItems: 'center',
                paddingHorizontal: 26 * s,
                paddingTop: 70 * s,
                paddingBottom: 18 * s,
              }}
            >
              <Text style={[styles.aboutTitleLine, { fontSize: aboutFont + 0.6 * s, lineHeight: aboutLine + 1 }]}>
                Ice Sky Falling Fish is a relaxing  yet 
              </Text>

              <View style={{ height: paraGap }} />

              <Text style={[styles.aboutText, { fontSize: aboutFont, lineHeight: aboutLine, maxWidth: cardW * 0.82 }]}>
               goal-driven puzzle game inspired by classic falling-block mechanics.
              </Text>

              <View style={{ height: paraGap }} />

              <Text style={[styles.aboutText, { fontSize: aboutFont, lineHeight: aboutLine, maxWidth: cardW * 0.82 }]}>
                Catch icy fish cubes from the sky, unlock collectible wallpapers, and enjoy a calm ice-fishing atmosphere.
              </Text>

              <View style={{ height: paraGap }} />

              <Text style={[styles.aboutText, { fontSize: aboutFont, lineHeight: aboutLine, maxWidth: cardW * 0.82 }]}>
                Play at your own pace or against the clock.
              </Text>
            </View>
          </ImageBackground>
        </View>

        <View style={{ flex: 1 }} />

        <View style={{ alignItems: 'center' }}>
          <Pressable
            onPress={onShare}
            hitSlop={10}
            android_ripple={Platform.OS === 'android' ? { color: 'rgba(255,255,255,0.10)' } : undefined}
          >
            <ImageBackground source={BTN_SHARE_ICE} style={{ width: shareW, height: shareH }} resizeMode="contain">
              <View style={styles.center}>
                <Text style={[styles.shareText, { fontSize: 16 * s }]}>Share</Text>
              </View>
            </ImageBackground>
          </Pressable>
        </View>

        <View style={{ height: (IS_TINY ? 10 : 14) * s }} />
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1 },
  wrap: { flex: 1, alignItems: 'center' },

  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  headTitle: {
    color: '#163A86',
    fontWeight: '900',
    letterSpacing: 0.2,
  },

  aboutTitleLine: {
    color: '#EAF2FF',
    fontWeight: '900',
    textAlign: 'center',
    opacity: 0.96,
  },

  aboutText: {
    color: '#EAF2FF',
    fontWeight: '800',
    textAlign: 'center',
    opacity: 0.92,
  },

  shareText: {
    color: '#163A86',
    fontWeight: '900',
    letterSpacing: 0.3,
  },
});
