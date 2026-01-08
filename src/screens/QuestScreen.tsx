import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ImageBackground,
  Image,
  useWindowDimensions,
  Animated,
  Easing,
  Modal,
  BackHandler,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Quest'>;

const STORAGE_KEY = 'collection_unlocked_cards_v1';

const BG2 = require('../assets/background2.png');
const BTN_TITLE = require('../assets/btn_progres.png');
const BTN_SKIP = require('../assets/btn_skip.png');
const ICON_BACK = require('../assets/icon_back.png');
const LOGO = require('../assets/logo.png');
const ROD = require('../assets/rod.png');
const BTN_PRIMARY = require('../assets/btn_primary.png');
const FISH_YELLOW = require('../assets/cube_yellow.png');
const FISH_BLUE = require('../assets/cube_blue.png');
const FISH_RED = require('../assets/cube_red.png');
const HOOK_ICON = require('../assets/hook.png');

const CARD_DEFS = {
  blue_1: { id: 'blue_1', img: require('../assets/wp_blue_1.png'), title: 'Blue Wallpaper 1' },
  blue_2: { id: 'blue_2', img: require('../assets/wp_blue_2.png'), title: 'Blue Wallpaper 2' },
  blue_3: { id: 'blue_3', img: require('../assets/wp_blue_3.png'), title: 'Blue Wallpaper 3' },
  yellow_1: { id: 'yellow_1', img: require('../assets/wp_yellow_1.png'), title: 'Yellow Wallpaper 1' },
  yellow_2: { id: 'yellow_2', img: require('../assets/wp_yellow_2.png'), title: 'Yellow Wallpaper 2' },
  yellow_3: { id: 'yellow_3', img: require('../assets/wp_yellow_3.png'), title: 'Yellow Wallpaper 3' },
  red_1: { id: 'red_1', img: require('../assets/wp_red_1.png'), title: 'Red Wallpaper 1' },
  red_2: { id: 'red_2', img: require('../assets/wp_red_2.png'), title: 'Red Wallpaper 2' },
  red_3: { id: 'red_3', img: require('../assets/wp_red_3.png'), title: 'Red Wallpaper 3' },
} as const;

const BLUE_IDS = ['blue_1', 'blue_2', 'blue_3'] as const;
const YELLOW_IDS = ['yellow_1', 'yellow_2', 'yellow_3'] as const;
const RED_IDS = ['red_1', 'red_2', 'red_3'] as const;

type CardId = keyof typeof CARD_DEFS;
type FishKind = 'yellow' | 'blue' | 'red';
type Phase = 'idle' | 'swim' | 'pull';

type StoredUnlockedItem = {
  id: CardId;
  color: FishKind;
  unlockedAt: number;
};

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

export default function QuestScreen({ navigation }: Props) {
  const { width: W, height: H } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const allowExitRef = useRef(false);

  useEffect(() => {
    navigation.setOptions({ gestureEnabled: false });
  }, [navigation]);

  const onBackPress = useCallback(() => {
    allowExitRef.current = true;
    navigation.goBack();
    setTimeout(() => { allowExitRef.current = false; }, 500);
  }, [navigation]);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      onBackPress();
      return true;
    });
    return () => sub.remove();
  }, [onBackPress]);

  const safeH = Math.max(1, H - insets.top - insets.bottom);
  const IS_TINY = safeH < 700;
  const IS_VERY_TINY = safeH < 620;
  const s = useMemo(() => clamp(safeH / 812, 0.72, 1.0), [safeH]);

  const topPad = insets.top + (IS_VERY_TINY ? 4 : IS_TINY ? 8 : 14) * s;
  const headerBtn = (IS_TINY ? 46 : 50) * s;
  const titleW = (IS_TINY ? 190 : 200) * s;
  const titleH = (IS_TINY ? 42 : 45) * s;
  
  const rodW = W * 1.06;
  const rodH = rodW * 0.7;
  const rodTop = topPad + (IS_VERY_TINY ? 34 : IS_TINY ? 50 : 80) * s;
  
  const panelW = W * (IS_TINY ? 0.88 : 0.85);
  const panelH = (IS_VERY_TINY ? 74 : IS_TINY ? 84 : 100) * s;
  const panelLeft = (W - panelW) / 2;
  const panelShift = IS_TINY ? 60 : 0; 
  const panelTop = rodTop + rodH * 0.55 + (IS_VERY_TINY ? 70 : IS_TINY ? 105 : 200) * s + panelShift;

  const circleSize = panelH * 0.85;
  const circleX = (panelW - circleSize) / 2;
  const circleY = (panelH - circleSize) / 2;
  
  const hookBtnSize = (IS_VERY_TINY ? 84 : IS_TINY ? 96 : 110) * s;
  const hookTop = panelTop + panelH + (IS_VERY_TINY ? 10 : IS_TINY ? 14 : 30) * s;
  const fishSize = panelH * 0.55;

  const [phase, setPhaseState] = useState<Phase>('idle');
  const phaseRef = useRef<Phase>('idle');
  const [currentFish, setCurrentFish] = useState<FishKind>('yellow');
  const [fishVisible, setFishVisible] = useState(false);
  const [pullProgress, setPullProgress] = useState(0);
  const pullRef = useRef(0);
  useEffect(() => { pullRef.current = pullProgress; }, [pullProgress]);
  const [flash, setFlash] = useState<'none' | 'ok' | 'bad'>('none');
  const [resultVisible, setResultVisible] = useState(false);
  const [resultCardId, setResultCardId] = useState<CardId | null>(null);

  const fishX = useRef(new Animated.Value(-200)).current;
  const fishXNum = useRef(-200);
  const fishAnimRef = useRef<Animated.CompositeAnimation | null>(null);
  const fishIndexRef = useRef(0);

  useEffect(() => {
    const id = fishX.addListener(({ value }) => { fishXNum.current = value; });
    return () => fishX.removeListener(id);
  }, [fishX]);

  const spawnFish = useCallback(() => {
    if (phaseRef.current !== 'swim') return;
    const kinds: FishKind[] = ['yellow', 'blue', 'red'];
    setCurrentFish(kinds[fishIndexRef.current % 3]);
    fishIndexRef.current++;
    setFishVisible(true);
    fishX.setValue(-fishSize - 20);
    const anim = Animated.timing(fishX, {
      toValue: panelW + 20,
      duration: IS_TINY ? 1600 : 1700,
      easing: Easing.linear,
      useNativeDriver: true,
    });
    fishAnimRef.current = anim;
    anim.start(({ finished }) => {
      if (finished && phaseRef.current === 'swim') {
        setTimeout(spawnFish, IS_TINY ? 850 : 1000);
      }
    });
  }, [IS_TINY, fishSize, fishX, panelW]);

  const handleWin = useCallback(async () => {
    const colorCaught = currentFish;
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      const unlocked: StoredUnlockedItem[] = raw ? JSON.parse(raw) : [];
      const poolIds = colorCaught === 'blue' ? BLUE_IDS : colorCaught === 'yellow' ? YELLOW_IDS : RED_IDS;
      const nextId = poolIds.find((id) => !unlocked.some((u) => u.id === id)) ?? null;
      if (nextId) {
        const updated: StoredUnlockedItem[] = [...unlocked, { id: nextId, color: colorCaught, unlockedAt: Date.now() }];
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        setResultCardId(nextId);
      } else {
        setResultCardId(null);
      }
    } catch { setResultCardId(null); }
    setFishVisible(false);
    setResultVisible(true);
    phaseRef.current = 'idle';
    setPhaseState('idle');
    setPullProgress(0);
  }, [currentFish]);

  const onHookPress = useCallback(async () => {
    if (phaseRef.current === 'swim') {
      const dist = Math.abs((fishXNum.current + fishSize / 2) - (circleX + circleSize / 2));
      if (dist < circleSize / 2) {
        fishAnimRef.current?.stop();
        phaseRef.current = 'pull';
        setPhaseState('pull');
        setPullProgress(0);
        setFlash('ok');
        fishX.setValue(circleX + (circleSize - fishSize) / 2);
        setTimeout(() => setFlash('none'), 280);
      } else {
        setFlash('bad');
        setTimeout(() => setFlash('none'), 230);
      }
      return;
    }
    if (phaseRef.current === 'pull') {
      const next = pullRef.current + 0.2;
      if (next >= 1) {
        setPullProgress(1);
        await handleWin();
      } else {
        setPullProgress(next);
      }
    }
  }, [circleSize, circleX, fishSize, fishX, handleWin]);

  const fishIcon = currentFish === 'yellow' ? FISH_YELLOW : currentFish === 'blue' ? FISH_BLUE : FISH_RED;
  const resultCard = resultCardId ? CARD_DEFS[resultCardId] : null;

  return (
    <ImageBackground source={BG2} style={styles.bg} resizeMode="cover">
      <View style={[styles.root, { paddingTop: topPad }]}>
        <View style={[styles.header, { width: W * 0.95 }]}>
          <Pressable onPress={onBackPress}>
            <ImageBackground source={BTN_SKIP} style={{ width: headerBtn, height: headerBtn }} resizeMode="contain">
              <View style={styles.center}>
                <Image source={ICON_BACK} style={{ width: 20 * s, height: 20 * s }} resizeMode="contain" />
              </View>
            </ImageBackground>
          </Pressable>
          <ImageBackground source={BTN_TITLE} style={{ width: titleW, height: titleH }} resizeMode="contain">
            <View style={styles.center}>
              <Text style={[styles.headerText, { fontSize: 16 * s }]}>Quest</Text>
            </View>
          </ImageBackground>
          <Image source={LOGO} style={{ width: headerBtn, height: headerBtn, borderRadius: headerBtn / 2 }} />
        </View>

        <Image
          source={ROD}
          style={{ position: 'absolute', left: -W * 0.08, top: rodTop, width: rodW, height: rodH }}
          resizeMode="contain"
        />

        {phase !== 'idle' && (
          <>
            <View style={[styles.panel, { left: panelLeft, top: panelTop, width: panelW, height: panelH, borderRadius: 12 * s, borderWidth: 2 * s }]}>
              {fishVisible && (
                <Animated.Image
                  source={fishIcon}
                  style={{ position: 'absolute', top: (panelH - fishSize) / 2, width: fishSize, height: fishSize, transform: [{ translateX: fishX }] }}
                  resizeMode="contain"
                />
              )}
              <View style={[styles.circle, { left: circleX, top: circleY, width: circleSize, height: circleSize, borderWidth: 3 * s, borderColor: flash === 'bad' ? '#FF3333' : (flash === 'ok' || phase === 'pull' ? '#00FF44' : '#FFF') }]} />
            </View>
            <Pressable onPress={onHookPress} style={[styles.hookBtn, { position: 'absolute', top: hookTop, width: hookBtnSize, height: hookBtnSize, left: (W - hookBtnSize) / 2, borderWidth: 3 * s }]}>
              <Image source={HOOK_ICON} style={{ width: '52%', height: '52%' }} resizeMode="contain" />
            </Pressable>
            {phase === 'pull' && (
              <View style={[styles.slider, { top: hookTop + hookBtnSize + 12 * s, width: W * 0.7, left: W * 0.15, height: 10 * s, borderRadius: 5 * s }]}>
                <View style={[styles.sliderFill, { width: `${pullProgress * 100}%` }]} />
              </View>
            )}
          </>
        )}

        {phase === 'idle' && (
          <Pressable
            onPress={() => {
              phaseRef.current = 'swim';
              setPhaseState('swim');
              spawnFish();
            }}
            style={{ position: 'absolute', bottom: insets.bottom + (IS_VERY_TINY ? 16 : IS_TINY ? 22 : 50) * s }}
          >
            <ImageBackground source={BTN_PRIMARY} style={{ width: 180 * s, height: 55 * s }} resizeMode="contain">
              <View style={styles.center}>
                <Text style={{ color: '#163A86', fontWeight: '900', fontSize: 18 * s }}>Start</Text>
              </View>
            </ImageBackground>
          </Pressable>
        )}

        <Modal visible={resultVisible} transparent animationType="fade" statusBarTranslucent>
          <View style={styles.modal}>
            <View style={[styles.resBox, { width: Math.min(W * 0.86, 420), padding: (IS_TINY ? 16 : 20) * s, borderRadius: 20 * s }]}>
              {resultCard ? (
                <>
                  <Image source={resultCard.img} style={[styles.resImg, { borderRadius: 10 * s }]} resizeMode="cover" />
                  <Text style={[styles.resTitle, { fontSize: 16 * s }]}>{resultCard.title}</Text>
                </>
              ) : (
                <Text style={[styles.resT, { fontSize: 18 * s }]}>All collected!</Text>
              )}
              <Text style={[styles.resT, { marginTop: 6 * s, fontSize: 20 * s }]}>Congratulations!</Text>
              <Pressable onPress={() => setResultVisible(false)} style={{ marginTop: 14 * s }}>
                <ImageBackground source={BTN_PRIMARY} style={{ width: 140 * s, height: 45 * s }} resizeMode="contain">
                  <View style={styles.center}>
                    <Text style={{ color: '#163A86', fontWeight: '900', fontSize: 16 * s }}>Close</Text>
                  </View>
                </ImageBackground>
              </Pressable>
            </View>
          </View>
        </Modal>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1 },
  root: { flex: 1, alignItems: 'center' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerText: { color: '#163A86', fontWeight: '900' },
  panel: { position: 'absolute', backgroundColor: 'rgba(30,90,215,0.8)', borderColor: '#FFF', overflow: 'hidden' },
  circle: { position: 'absolute', borderRadius: 999 },
  hookBtn: { borderRadius: 999, backgroundColor: '#FFF', borderColor: '#78AAFF', alignItems: 'center', justifyContent: 'center' },
  slider: { backgroundColor: 'rgba(0,0,0,0.3)', overflow: 'hidden', position: 'absolute' },
  sliderFill: { height: '100%', backgroundColor: '#00AAFF' },
  modal: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center' },
  resBox: { backgroundColor: '#1E5AD7', alignItems: 'center', borderWidth: 1, borderColor: '#FFF' },
  resImg: { width: '100%', aspectRatio: 1, marginBottom: 10 },
  resT: { color: '#FFF', fontWeight: '900', textAlign: 'center' },
  resTitle: { color: '#FFFFFF', fontWeight: '800', textAlign: 'center', marginBottom: 2 },
});