import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Image,
  ImageBackground,
  Platform,
  Share,
  useWindowDimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Progress'>;

const BG = require('../assets/background.png');
const BTN_PROGRESS = require('../assets/btn_progres.png');
const BTN_SKIP = require('../assets/btn_skip.png');
const BTN_PRIMARY = require('../assets/btn_primary.png');

const ICON_BACK = require('../assets/icon_back.png');
const ICON_LEFT = require('../assets/icon_left.png');
const ICON_RIGHT = require('../assets/icon_right.png');
const LOGO = require('../assets/logo.png');

const CUBE_BLUE = require('../assets/cube_blue.png');
const CUBE_RED = require('../assets/cube_red.png');
const CUBE_YELLOW = require('../assets/cube_yellow.png');

const BIG_BLUE = require('../assets/big_blue.png');
const BIG_RED = require('../assets/big_red.png');
const BIG_YELLOW = require('../assets/big_yellow.png');

const PROGRESS_PANEL = require('../assets/progress_panel.png');

type CubeColor = 'blue' | 'red' | 'yellow';
type MatchCounts = Record<CubeColor, number>;

const STORAGE_RELAX_TOTAL_TRIPLES = 'relax_total_triples_v1';
const STORAGE_GOAL_TOTAL = 'goal_total_stats_v1';

const MAX_PROGRESS = 500;

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

async function safeJSON<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

const bigFish = (c: CubeColor) => (c === 'blue' ? BIG_BLUE : c === 'red' ? BIG_RED : BIG_YELLOW);
const cubeIcon = (c: CubeColor) => (c === 'blue' ? CUBE_BLUE : c === 'red' ? CUBE_RED : CUBE_YELLOW);

export default function ProgressScreen({ navigation }: Props) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    navigation.setOptions?.({ gestureEnabled: false });
  }, [navigation]);

  const safeH = height - insets.top - insets.bottom;
  const IS_SMALL = safeH < 720;
  const IS_TINY = safeH < 660;
  const scale = useMemo(() => clamp(safeH / 812, 0.72, 1), [safeH]);
  const heroSize = width * (IS_TINY ? 0.48 : IS_SMALL ? 0.52 : 0.56);
  const panelW = width * 0.82;
  const panelH = safeH * (IS_TINY ? 0.22 : IS_SMALL ? 0.24 : 0.26);
  const shareH = 56 * scale;
  const arrowSize = 56 * scale;
  const BOTTOM_GAP = 60;
  const bottomOffset = Math.max(BOTTOM_GAP, insets.bottom + 18);

  const [page, setPage] = useState<0 | 1 | 2>(0);
  const pageColor: CubeColor = page === 0 ? 'blue' : page === 1 ? 'red' : 'yellow';

  const [totals, setTotals] = useState<MatchCounts>({ blue: 0, red: 0, yellow: 0 });
  const [totalAll, setTotalAll] = useState(0);

  const load = useCallback(async () => {
    const relax = await safeJSON<MatchCounts>(STORAGE_RELAX_TOTAL_TRIPLES, { blue: 0, red: 0, yellow: 0 });
    const goal = await safeJSON<any>(STORAGE_GOAL_TOTAL, {});
    const goalCollected = goal?.totalCollected ?? {};

    const merged: MatchCounts = {
      blue: relax.blue + (goalCollected.blue ?? 0),
      red: relax.red + (goalCollected.red ?? 0),
      yellow: relax.yellow + (goalCollected.yellow ?? 0),
    };

    setTotals(merged);
    setTotalAll(merged.blue + merged.red + merged.yellow);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const progress = Math.min(totals[pageColor] ?? 0, MAX_PROGRESS);
  const unlocked = clamp(Math.floor(totalAll / 100), 0, 5);

  const onShare = async () => {
    try {
      await Share.share({
        message:
          `My color is ${pageColor.toUpperCase()}!\n` +
          `Progress: ${progress}/${MAX_PROGRESS}\n` +
          `Total ${pageColor.toUpperCase()} catch: ${totals[pageColor]}\n` +
          `Unlocked content: ${unlocked}/5`,
      });
    } catch {
    }
  };

  return (
    <ImageBackground source={BG} style={styles.bg} resizeMode="cover">
      <View style={[styles.root, { paddingTop: insets.top + 24 }]}>
        <View style={styles.header}>
          <Pressable
            onPress={() => navigation.goBack()}
            hitSlop={10}
            android_ripple={Platform.OS === 'android' ? { color: 'rgba(255,255,255,0.12)', borderless: true } : undefined}
          >
            <ImageBackground source={BTN_SKIP} style={styles.headerBtn} resizeMode="contain">
              <Image source={ICON_BACK} style={styles.headerIcon} resizeMode="contain" />
            </ImageBackground>
          </Pressable>

          <ImageBackground source={BTN_PROGRESS} style={styles.headerTitle} resizeMode="contain">
            <Text style={styles.headerText}>Progress</Text>
          </ImageBackground>

          <ImageBackground source={BTN_SKIP} style={styles.headerBtn} resizeMode="contain">
            <Image source={LOGO} style={styles.logo} resizeMode="cover" />
          </ImageBackground>
        </View>
        <Image source={bigFish(pageColor)} style={{ width: heroSize, height: heroSize }} resizeMode="contain" />
        <ImageBackground
          source={PROGRESS_PANEL}
          style={{ width: panelW, height: panelH }}
          resizeMode="stretch"
        >
          <View style={[styles.panel, { paddingHorizontal: 22 * scale }]}>
            <Text style={[styles.panelTitle, { fontSize: 14 * scale }]}>Your progress:</Text>

            <View style={[styles.pill, { marginTop: 10 * scale, paddingVertical: 8 * scale, paddingHorizontal: 16 * scale }]}>
              <Image source={cubeIcon(pageColor)} style={{ width: 18 * scale, height: 18 * scale, marginRight: 8 * scale }} resizeMode="contain" />
              <Text style={[styles.pillText, { fontSize: 16 * scale }]}>
                {progress}/{MAX_PROGRESS}
              </Text>
            </View>

            <Text style={[styles.line, { marginTop: 10 * scale, fontSize: 12.5 * scale }]}>
              Total {pageColor.toUpperCase()} catch: {totals[pageColor] ?? 0}
            </Text>

            <Text style={[styles.subLine, { marginTop: 6 * scale, fontSize: 12 * scale }]}>
              Unlocked content: {unlocked}/5
            </Text>
          </View>
        </ImageBackground>
        <View pointerEvents="box-none" style={[styles.bottomWrap, { bottom: bottomOffset, width: panelW }]}>
          <View style={styles.bottomRow}>
            <Pressable onPress={onShare} hitSlop={10}>
              <ImageBackground source={BTN_PRIMARY} style={{ height: shareH, width: panelW * 0.6 }} resizeMode="contain">
                <View style={styles.center}>
                  <Text style={[styles.shareText, { fontSize: 15 * scale }]}>Share</Text>
                </View>
              </ImageBackground>
            </Pressable>

            <View style={styles.arrows}>
              {page > 0 && (
                <Pressable
                  onPress={() => setPage((p) => (p - 1) as any)}
                  hitSlop={10}
                  android_ripple={Platform.OS === 'android' ? { color: 'rgba(255,255,255,0.12)', borderless: true } : undefined}
                >
                  <ImageBackground source={BTN_SKIP} style={{ width: arrowSize, height: arrowSize }} resizeMode="contain">
                    <View style={styles.center}>
                      <Image source={ICON_LEFT} style={{ width: 22 * scale, height: 22 * scale }} resizeMode="contain" />
                    </View>
                  </ImageBackground>
                </Pressable>
              )}

              {page < 2 && (
                <Pressable
                  onPress={() => setPage((p) => (p + 1) as any)}
                  hitSlop={10}
                  android_ripple={Platform.OS === 'android' ? { color: 'rgba(255,255,255,0.12)', borderless: true } : undefined}
                >
                  <ImageBackground source={BTN_SKIP} style={{ width: arrowSize, height: arrowSize }} resizeMode="contain">
                    <View style={styles.center}>
                      <Image source={ICON_RIGHT} style={{ width: 22 * scale, height: 22 * scale }} resizeMode="contain" />
                    </View>
                  </ImageBackground>
                </Pressable>
              )}
            </View>
          </View>
        </View>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1 },
  root: { flex: 1, alignItems: 'center' },

  header: {
    width: '92%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerBtn: { width: 56, height: 56, justifyContent: 'center', alignItems: 'center' },
  headerIcon: { width: 22, height: 22 },
  headerTitle: { width: 230, height: 54, justifyContent: 'center', alignItems: 'center' },
  headerText: { fontWeight: '900', color: '#163A86', fontSize: 18, letterSpacing: 0.2 },
  logo: { width: 40, height: 40, borderRadius: 20 },

  panel: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  panelTitle: { fontWeight: '900', color: '#163A86', letterSpacing: 0.2 },

  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderRadius: 14,
  },
  pillText: { color: '#fff', fontWeight: '900', letterSpacing: 0.2 },

  line: { color: '#fff', fontWeight: '800', textAlign: 'center' },
  subLine: { color: '#163A86', fontWeight: '900', textAlign: 'center', opacity: 0.9 },

  bottomWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  bottomRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  arrows: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  center: { alignItems: 'center', justifyContent: 'center', flex: 1 },

  shareText: { color: '#163A86', fontWeight: '900', letterSpacing: 0.2 },
});
