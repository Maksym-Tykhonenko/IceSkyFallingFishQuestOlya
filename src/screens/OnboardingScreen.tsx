import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  ImageBackground,
  Image,
  FlatList,
  Pressable,
  useWindowDimensions,
  Animated,
  Easing,
  Text,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Onboarding'>;

const BG = require('../assets/background.png');
const TOP_1 = require('../assets/onboarding1.png');
const TOP_2 = require('../assets/onboarding2.png');
const TOP_3 = require('../assets/onboarding3.png');
const PANEL = require('../assets/onboarding_panel.png');
const BTN_PRIMARY = require('../assets/btn_primary.png');
const BTN_SKIP = require('../assets/btn_skip.png');

type Page = {
  key: 'p1' | 'p2' | 'p3';
  top: any;
  title: string;
  desc: string;
  primaryLabel: string;
};

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

function getSizes(W: number, H: number, insets: { top: number; bottom: number }) {
  const safeH = Math.max(1, H - insets.top - insets.bottom);
  const IS_TINY = safeH <= 680; 
  const IS_SMALL = safeH <= 740;

  const base = safeH / 812;
  const s = clamp(base, 0.78, 1.02);

  const contentW = Math.min(W * 0.92, 420);

  const topMax = safeH * (IS_TINY ? 0.44 : IS_SMALL ? 0.50 : 0.58);
  const topH = clamp(topMax, 210, 520) * (IS_TINY ? 0.92 : 1) * s;
  const topW = clamp(contentW * 1.02, 260, 440) * (IS_TINY ? 0.92 : 1) * s;

  const panelH = clamp(safeH * (IS_TINY ? 0.28 : 0.27), 210, 270) * s;
  const panelW = contentW;

  const primaryW = clamp(W * 0.58, 200, 250) * (IS_TINY ? 0.92 : 1);
  const primaryH = primaryW * 0.36;

  const skipSize = clamp(W * 0.14, 54, 70) * (IS_TINY ? 0.86 : 1);

  const topPad = insets.top + (IS_TINY ? 6 : 12);
  const bottomPad = (IS_TINY ? 6 : 12) + Math.min(insets.bottom, IS_TINY ? 6 : 12);

  const titleFont = IS_TINY ? 13 : IS_SMALL ? 15 : 16;
  const descFont = IS_TINY ? 10 : 12;
  const descLine = IS_TINY ? 13 : 16;

  const btnFont = IS_TINY ? 13 : 14;
  const skipFont = IS_TINY ? 10 : 11;

  const panelPadTop = IS_TINY ? 16 : 26;
  const panelPadBottom = IS_TINY ? 10 : 16;
  const panelPadX = IS_TINY ? 18 : 22;

  const btnGapTop = IS_TINY ? 6 : 12;
  const btnGap = IS_TINY ? 8 : 10;

  const textShiftY = IS_TINY ? 10 : 0;

  return {
    safeH, IS_TINY, IS_SMALL, s, contentW, topW, topH, panelW, panelH,
    primaryW, primaryH, skipSize, topPad, bottomPad, titleFont,
    descFont, descLine, btnFont, skipFont, panelPadTop, panelPadBottom,
    panelPadX, btnGapTop, btnGap, textShiftY,
  };
}

function TextBlock({
  text,
  variant,
  size,
}: {
  text: string;
  variant: 'title' | 'desc' | 'btn' | 'skip';
  size: ReturnType<typeof getSizes>;
}) {
  if (variant === 'title') {
    return <Text style={[styles.title, { fontSize: size.titleFont }]}>{text}</Text>;
  }
  if (variant === 'desc') {
    return (
      <Text
        style={[
          styles.desc,
          {
            fontSize: size.descFont,
            lineHeight: size.descLine,
            paddingHorizontal: size.panelPadX,
          },
        ]}
      >
        {text}
      </Text>
    );
  }
  if (variant === 'btn') {
    return <Text style={[styles.btnText, { fontSize: size.btnFont }]}>{text}</Text>;
  }
  return <Text style={[styles.skipText, { fontSize: size.skipFont }]}>{text}</Text>;
}

function OnboardingPage({
  item,
  W,
  H,
  insets,
  isActive,
  size,
  onPrimaryPress,
  onSkipPress,
}: {
  item: Page;
  W: number;
  H: number;
  insets: { top: number; bottom: number };
  isActive: boolean;
  size: ReturnType<typeof getSizes>;
  onPrimaryPress: () => void;
  onSkipPress: () => void;
}) {
  const aTop = useRef(new Animated.Value(0)).current;
  const aPanel = useRef(new Animated.Value(0)).current;
  const aBtns = useRef(new Animated.Value(0)).current;

  const run = useCallback(() => {
    aTop.stopAnimation();
    aPanel.stopAnimation();
    aBtns.stopAnimation();
    aTop.setValue(0);
    aPanel.setValue(0);
    aBtns.setValue(0);

    Animated.sequence([
      Animated.timing(aTop, {
        toValue: 1,
        duration: 360,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(aPanel, {
        toValue: 1,
        duration: 340,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(aBtns, {
        toValue: 1,
        duration: 300,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [aBtns, aPanel, aTop]);

  useEffect(() => {
    if (isActive) run();
    else {
      aTop.setValue(0);
      aPanel.setValue(0);
      aBtns.setValue(0);
    }
  }, [isActive, run, aBtns, aPanel, aTop]);

  const topStyle = {
    opacity: aTop,
    transform: [
      { translateY: aTop.interpolate({ inputRange: [0, 1], outputRange: [-10, 0] }) },
      { scale: aTop.interpolate({ inputRange: [0, 1], outputRange: [0.985, 1] }) },
    ],
  };

  const panelStyle = {
    opacity: aPanel,
    transform: [
      { translateY: aPanel.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) },
      { scale: aPanel.interpolate({ inputRange: [0, 1], outputRange: [0.99, 1] }) },
    ],
  };

  const btnsStyle = {
    opacity: aBtns,
    transform: [{ translateY: aBtns.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }],
  };

  return (
    <View style={{ width: W, height: H }}>
      <View style={[styles.pageWrap, { paddingTop: size.topPad, paddingBottom: size.bottomPad }]}>
   
        <View style={[styles.topArea, { marginTop: 20 }]}>
          <Animated.View style={[styles.topCenter, topStyle]}>
            <Image source={item.top} style={{ width: size.topW, height: size.topH }} resizeMode="contain" />
          </Animated.View>
        </View>

        <View style={[styles.bottomArea, { marginBottom: 60 }]}>
          <Animated.View style={panelStyle}>
            <ImageBackground source={PANEL} style={{ width: size.panelW, height: size.panelH }} resizeMode="contain">
              <View style={[styles.panelTextWrap, { paddingTop: size.panelPadTop, paddingBottom: size.panelPadBottom }]}>
                <View style={[styles.panelTextInner, { transform: [{ translateY: size.textShiftY }] }]}>
                  <View style={{ paddingHorizontal: size.panelPadX }}>
                    <TextBlock text={item.title} variant="title" size={size} />
                  </View>

                  <View style={{ marginTop: size.IS_TINY ? 6 : 10 }}>
                    <TextBlock text={item.desc} variant="desc" size={size} />
                  </View>
                </View>
              </View>
            </ImageBackground>
          </Animated.View>

          <Animated.View style={[styles.buttonsRow, { width: size.panelW, marginTop: size.btnGapTop }, btnsStyle]}>
            <Pressable
              onPress={onPrimaryPress}
              hitSlop={12}
              android_ripple={Platform.OS === 'android' ? { color: 'rgba(255,255,255,0.12)', borderless: false } : undefined}
            >
              <ImageBackground source={BTN_PRIMARY} style={{ width: size.primaryW, height: size.primaryH }} resizeMode="contain">
                <View style={styles.btnCenter}>
                  <TextBlock text={item.primaryLabel} variant="btn" size={size} />
                </View>
              </ImageBackground>
            </Pressable>

            <Pressable
              onPress={onSkipPress}
              hitSlop={12}
              style={{ marginLeft: size.btnGap }}
              android_ripple={Platform.OS === 'android' ? { color: 'rgba(255,255,255,0.12)', borderless: true } : undefined}
            >
              <ImageBackground source={BTN_SKIP} style={{ width: size.skipSize, height: size.skipSize }} resizeMode="contain">
                <View style={styles.btnCenter}>
                  <TextBlock text="Skip" variant="skip" size={size} />
                </View>
              </ImageBackground>
            </Pressable>
          </Animated.View>
        </View>
      </View>
    </View>
  );
}

export default function OnboardingScreen({ navigation }: Props) {
  const { width: W, height: H } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const listRef = useRef<FlatList<Page>>(null);

  const pages: Page[] = useMemo(
    () => [
      {
        key: 'p1',
        top: TOP_1,
        title: "Hello! I'm your host",
        desc: "In this icy world, ice cubes with\nfish fall from a helicopter.\nYou stack them — and just\nenjoy the game.",
        primaryLabel: 'Next',
      },
      {
        key: 'p2',
        top: TOP_2,
        title: 'Choose how to play',
        desc: 'Relax mode — without a timer\nand rush.\nGoal mode — collect the required\nnumber of fish for a certain time.',
        primaryLabel: 'Continue',
      },
      {
        key: 'p3',
        top: TOP_3,
        title: 'Each fish is your progress',
        desc: 'The ice gradually melts, and the\nfish open.\nOnce a day, catch a fish in a hole\nand open collectible wallpapers.',
        primaryLabel: 'Start',
      },
    ],
    []
  );

  const [index, setIndex] = useState(0);
  const size = useMemo(() => getSizes(W, H, insets), [W, H, insets]);

  const scrollTo = useCallback(
    (nextIdx: number) => {
      const clamped = Math.max(0, Math.min(nextIdx, pages.length - 1));
      listRef.current?.scrollToOffset({ offset: clamped * W, animated: true });
      setIndex(clamped);
    },
    [W, pages.length]
  );

  const onPrimaryPress = () => {
    if (index < pages.length - 1) scrollTo(index + 1);
    else navigation.replace('Menu');
  };

  const onSkipPress = () => navigation.replace('Menu');

  const renderItem = ({ item }: { item: Page }) => {
    const isActive = item.key === pages[index]?.key;
    return (
      <OnboardingPage
        item={item}
        W={W}
        H={H}
        insets={insets}
        isActive={isActive}
        size={size}
        onPrimaryPress={onPrimaryPress}
        onSkipPress={onSkipPress}
      />
    );
  };

  return (
    <ImageBackground source={BG} style={styles.bg} resizeMode="cover">
      <FlatList
        ref={listRef}
        data={pages}
        renderItem={renderItem}
        keyExtractor={(it) => it.key}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        scrollEnabled={false}
      />
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1 },
  pageWrap: { flex: 1 },
  topArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topCenter: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomArea: {
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  panelTextWrap: {
    flex: 1,
    justifyContent: 'center',
  },
  panelTextInner: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    textAlign: 'center',
    color: '#FFFFFF',
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  desc: {
    textAlign: 'center',
    color: 'rgba(255,255,255,0.90)',
    fontWeight: '600',
  },
  buttonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: {
    color: '#0B2C6A',
    fontWeight: '900',
    letterSpacing: 0.4,
  },
  skipText: {
    color: '#0B2C6A',
    fontWeight: '900',
    letterSpacing: 0.2,
  },
});