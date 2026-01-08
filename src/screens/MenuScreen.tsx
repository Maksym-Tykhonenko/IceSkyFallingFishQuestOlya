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
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Menu'>;

const BG = require('../assets/background.png');
const TOP_ICON = require('../assets/logo.png');

const BTN_PRIMARY = require('../assets/btn_primary.png');
const BTN_PROGRESS = require('../assets/btn_progres.png');
const BTN_SKIP = require('../assets/btn_skip.png');

const ICON_COLLECTION = require('../assets/icon_collection.png');
const ICON_ABOUT = require('../assets/icon_about.png');

function ImgButton({
  bg,
  title,
  w,
  h,
  onPress,
  textStyle,
  containerStyle,
  icon,
  iconSize,
}: {
  bg: any;
  title?: string;
  w: number;
  h: number;
  onPress: () => void;
  textStyle?: any;
  containerStyle?: any;
  icon?: any;
  iconSize?: number;
}) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={10}
      style={containerStyle}
      android_ripple={Platform.OS === 'android' ? { color: 'rgba(255,255,255,0.12)', borderless: true } : undefined}
    >
      <ImageBackground source={bg} style={{ width: w, height: h }} resizeMode="contain">
        <View style={styles.center}>
          {!!title && <Text style={textStyle}>{title}</Text>}
          {!!icon && (
            <Image
              source={icon}
              style={{
                width: iconSize ?? Math.min(w, h) * 0.42,
                height: iconSize ?? Math.min(w, h) * 0.42,
              }}
              resizeMode="contain"
            />
          )}
        </View>
      </ImageBackground>
    </Pressable>
  );
}

export default function MenuScreen({ navigation }: Props) {
  const { width: W, height: H } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const safeH = Math.max(1, H - insets.top - insets.bottom);
  const IS_TINY = safeH < 700;
  const IS_SMALL = safeH < 760;

  const s = useMemo(() => {
    const base = safeH / 812;
    return Math.max(0.76, Math.min(1.02, base));
  }, [safeH]);

  const topPad = insets.top + (IS_TINY ? 8 : 16) + 30;

  const iconSize = useMemo(() => Math.min(W * 0.62, 270) * (IS_TINY ? 0.88 : 1) * s, [W, IS_TINY, s]);
  const logoRadius = useMemo(() => iconSize * 0.6, [iconSize]);

  const gameW = useMemo(() => Math.min(W * 0.88, 380) * s, [W, s]);
  const gameH = useMemo(() => gameW * 0.38, [gameW]);

  const smallW = useMemo(() => Math.min(W * 0.62, 290) * (IS_TINY ? 0.96 : 1) * s, [W, IS_TINY, s]);
  const smallH = useMemo(() => smallW * 0.33, [smallW]);

  const roundSize = useMemo(() => Math.min(W * 0.18, 76) * (IS_TINY ? 0.9 : 1) * s, [W, IS_TINY, s]);
  const roundIcon = useMemo(() => roundSize * 0.46, [roundSize]);

  const gap1 = IS_TINY ? 10 : IS_SMALL ? 16 : 20;
  const gap2 = IS_TINY ? 10 : 14;
  const gap3 = IS_TINY ? 8 : 10;

  const aLogo = useRef(new Animated.Value(0)).current;
  const aGame = useRef(new Animated.Value(0)).current;
  const aMid = useRef(new Animated.Value(0)).current;
  const aBottom = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    aLogo.setValue(0);
    aGame.setValue(0);
    aMid.setValue(0);
    aBottom.setValue(0);

    Animated.sequence([
      Animated.timing(aLogo, {
        toValue: 1,
        duration: 420,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(aGame, {
        toValue: 1,
        duration: 380,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(aMid, {
        toValue: 1,
        duration: 340,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(aBottom, {
        toValue: 1,
        duration: 320,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [aBottom, aGame, aLogo, aMid]);

  const logoAnim = {
    opacity: aLogo,
    transform: [
      { translateY: aLogo.interpolate({ inputRange: [0, 1], outputRange: [-14, 0] }) },
      { scale: aLogo.interpolate({ inputRange: [0, 1], outputRange: [0.985, 1] }) },
    ],
  };

  const gameAnim = {
    opacity: aGame,
    transform: [{ translateY: aGame.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }],
  };

  const midAnim = {
    opacity: aMid,
    transform: [{ translateY: aMid.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }],
  };

  const bottomAnim = {
    opacity: aBottom,
    transform: [{ translateY: aBottom.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }],
  };

  return (
    <ImageBackground source={BG} style={styles.bg} resizeMode="cover">
      <View style={[styles.wrap, { paddingTop: topPad, paddingBottom: insets.bottom + (IS_TINY ? 14 : 18) }]}>
        <Animated.View style={[styles.topBlock, logoAnim]}>
          <View style={{ width: iconSize, height: iconSize, borderRadius: logoRadius, overflow: 'hidden' }}>
            <Image source={TOP_ICON} style={{ width: iconSize, height: iconSize }} resizeMode="cover" />
          </View>
        </Animated.View>

        <View style={{ height: gap1 }} />

        <Animated.View style={gameAnim}>
          <ImgButton
            bg={BTN_PRIMARY}
            title="Game"
            w={gameW}
            h={gameH}
            onPress={() => navigation.navigate('GameCategory')}
            textStyle={[styles.gameText, { fontSize: 30 * (IS_TINY ? 0.9 : 1) * s }]}
          />
        </Animated.View>

        <View style={{ height: gap2 }} />

        <Animated.View style={midAnim}>
          <ImgButton
            bg={BTN_PROGRESS}
            title="Progress"
            w={smallW}
            h={smallH}
            onPress={() => navigation.navigate('Progress')}
            textStyle={[styles.smallText, { fontSize: 16 * (IS_TINY ? 0.9 : 1) * s }]}
          />

          <View style={{ height: gap3 }} />

          <ImgButton
            bg={BTN_PROGRESS}
            title="Quest"
            w={smallW}
            h={smallH}
            onPress={() => navigation.navigate('Quest')}
            textStyle={[styles.smallText, { fontSize: 16 * (IS_TINY ? 0.9 : 1) * s }]}
          />
        </Animated.View>

        <Animated.View style={[styles.bottomRow, { marginTop: IS_TINY ? 14 : 18 }, bottomAnim]}>
          <ImgButton
            bg={BTN_SKIP}
            w={roundSize}
            h={roundSize}
            icon={ICON_COLLECTION}
            iconSize={roundIcon}
            onPress={() => navigation.navigate('CollectionNoData')}
            containerStyle={{ marginRight: 14 }}
          />
          <ImgButton
            bg={BTN_SKIP}
            w={roundSize}
            h={roundSize}
            icon={ICON_ABOUT}
            iconSize={roundIcon}
            onPress={() => navigation.navigate('About')}
          />
        </Animated.View>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1 },
  wrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  topBlock: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gameText: {
    color: '#163A86',
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  smallText: {
    color: '#163A86',
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});