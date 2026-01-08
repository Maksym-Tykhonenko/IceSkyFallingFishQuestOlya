import React, { useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Image,
  ImageBackground,
  useWindowDimensions,
  Platform,
  Animated,
  Easing,
  BackHandler,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'GameCategory'>;

const BG = require('../assets/background.png');

const BTN_PRIMARY = require('../assets/btn_primary.png');
const BTN_PROGRESS = require('../assets/btn_progres.png');
const BTN_SKIP = require('../assets/btn_skip.png');

const LOGO = require('../assets/logo.png');
const ICON_BACK = require('../assets/icon_back.png');

function IceCard({
  title,
  desc,
  onPress,
  titleW,
  titleH,
  descW,
  descH,
  s,
}: {
  title: string;
  desc: string;
  onPress: () => void;
  titleW: number;
  titleH: number;
  descW: number;
  descH: number;
  s: number;
}) {
  const touchW = Math.floor(descW * 0.78);

  return (
    <View style={{ alignItems: 'center' }}>
      <Pressable
        onPress={onPress}
        style={{ width: touchW, alignItems: 'center', alignSelf: 'center' }}
        android_ripple={
          Platform.OS === 'android'
            ? { color: 'rgba(255,255,255,0.10)', borderless: false }
            : undefined
        }
      >
        <View style={{ alignItems: 'center' }}>
          <ImageBackground
            source={BTN_PRIMARY}
            style={{ width: titleW, height: titleH }}
            resizeMode="contain"
          >
            <View style={styles.center}>
              <Text style={[styles.cardTitle, { fontSize: 18 * s }]}>{title}</Text>
            </View>
          </ImageBackground>

          <ImageBackground
            source={BTN_PROGRESS}
            style={{ width: descW, height: descH, marginTop: (-12 * s) + 10 }}
            resizeMode="contain"
          >
            <View style={[styles.center, { paddingHorizontal: 18 * s }]}>
              <Text style={[styles.cardDesc, { fontSize: 12 * s, lineHeight: 16 * s }]}>
                {desc}
              </Text>
            </View>
          </ImageBackground>
        </View>
      </Pressable>
    </View>
  );
}

export default function GameCategoryScreen({ navigation }: Props) {
  const { width: W, height: H } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  useEffect(() => {
    const parent = navigation.getParent?.();
    navigation.setOptions({ gestureEnabled: false as any });
    parent?.setOptions?.({ gestureEnabled: false as any });
  }, [navigation]);

  useFocusEffect(
    React.useCallback(() => {
      if (Platform.OS !== 'android') return;
      const sub = BackHandler.addEventListener('hardwareBackPress', () => {
        return true;
      });

      return () => sub.remove();
    }, [])
  );

  const safeH = Math.max(1, H - insets.top - insets.bottom);
  const IS_TINY = safeH < 700;
  const IS_SMALL = safeH < 760;

  const s = useMemo(() => {
    const base = safeH / 812;
    return Math.max(0.76, Math.min(1.02, base));
  }, [safeH]);

  const topPad = insets.top + 30;

  const headH = 56 * s;
  const sideSize = Math.min(W * 0.14, 64) * (IS_TINY ? 0.92 : 1) * s;
  const centerW = Math.min(W * 0.56, 260) * s;
  const centerH = Math.max(44 * s, headH * 0.78);

  const blockW = Math.min(W * 0.92, 420);

  const titleW = Math.min(W * 0.62, 320) * (IS_TINY ? 0.96 : 1) * s;
  const titleH = titleW * 0.22;

  const descW = Math.min(W * 0.86, 390) * (IS_TINY ? 0.98 : 1);
  const descH = Math.max(84 * s, descW * 0.31);

  const gapTop = IS_TINY ? 34 : IS_SMALL ? 40 : 44;
  const gapBetween = IS_TINY ? 34 : IS_SMALL ? 40 : 44;

  const aHeader = useRef(new Animated.Value(0)).current;
  const aFirst = useRef(new Animated.Value(0)).current;
  const aSecond = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    aHeader.setValue(0);
    aFirst.setValue(0);
    aSecond.setValue(0);

    Animated.sequence([
      Animated.timing(aHeader, {
        toValue: 1,
        duration: 420,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(aFirst, {
        toValue: 1,
        duration: 380,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(aSecond, {
        toValue: 1,
        duration: 360,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [aHeader, aFirst, aSecond]);

  const headerAnim = {
    opacity: aHeader,
    transform: [
      { translateY: aHeader.interpolate({ inputRange: [0, 1], outputRange: [-12, 0] }) },
    ],
  };

  const firstAnim = {
    opacity: aFirst,
    transform: [
      { translateY: aFirst.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) },
    ],
  };

  const secondAnim = {
    opacity: aSecond,
    transform: [
      { translateY: aSecond.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) },
    ],
  };

  const goMenuOnlyByButton = () => {
    navigation.replace('Menu');
  };

  return (
    <ImageBackground source={BG} style={styles.bg} resizeMode="cover">
      <View
        style={[
          styles.wrap,
          { paddingTop: topPad, paddingBottom: insets.bottom + (IS_TINY ? 14 : 18) },
        ]}
      >
        <Animated.View style={[styles.headerRow, { height: headH, width: blockW }, headerAnim]}>
          <Pressable
            onPress={goMenuOnlyByButton}
            hitSlop={10}
            android_ripple={
              Platform.OS === 'android'
                ? { color: 'rgba(255,255,255,0.12)', borderless: true }
                : undefined
            }
          >
            <ImageBackground source={BTN_SKIP} style={{ width: sideSize, height: sideSize }} resizeMode="contain">
              <View style={styles.center}>
                <Image
                  source={ICON_BACK}
                  style={{ width: sideSize * 0.42, height: sideSize * 0.42 }}
                  resizeMode="contain"
                />
              </View>
            </ImageBackground>
          </Pressable>

          <ImageBackground source={BTN_PROGRESS} style={{ width: centerW, height: centerH }} resizeMode="contain">
            <View style={styles.center}>
              <Text style={[styles.headTitle, { fontSize: 18 * s }]}>Game</Text>
            </View>
          </ImageBackground>

          <View style={{ width: sideSize, height: sideSize }}>
            <ImageBackground source={BTN_SKIP} style={{ width: sideSize, height: sideSize }} resizeMode="contain">
              <View style={styles.center}>
                <View
                  style={{
                    width: sideSize * 0.78,
                    height: sideSize * 0.78,
                    borderRadius: sideSize * 0.39,
                    overflow: 'hidden',
                  }}
                >
                  <Image source={LOGO} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                </View>
              </View>
            </ImageBackground>
          </View>
        </Animated.View>

        <View style={{ height: gapTop }} />

        <Animated.View style={firstAnim}>
          <IceCard
            title="Relax Mode"
            desc="A relaxing game without a timer.Play at your own pace and relax."
            onPress={() => navigation.navigate('GameRelaxMode', { categoryId: 'relax_default' })}
            titleW={titleW}
            titleH={titleH}
            descW={descW}
            descH={descH}
            s={s}
          />
        </Animated.View>

        <View style={{ height: gapBetween }} />

        <Animated.View style={secondAnim}>
          <IceCard
            title="Goal Mode"
            desc="Collect the required number of fish in a limited time. Test your speed and logic."
            onPress={() => navigation.navigate('GameGoalMode', { categoryId: 'goal_default' })}
            titleW={titleW}
            titleH={titleH}
            descW={descW}
            descH={descH}
            s={s}
          />
        </Animated.View>
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
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headTitle: {
    color: '#163A86',
    fontWeight: '900',
    letterSpacing: 0.2,
  },
  cardTitle: {
    color: '#163A86',
    fontWeight: '900',
    letterSpacing: 0.2,
  },
  cardDesc: {
    color: '#163A86',
    fontWeight: '800',
    textAlign: 'center',
    opacity: 0.92,
  },
});
