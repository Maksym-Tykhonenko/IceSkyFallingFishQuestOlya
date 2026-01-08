import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { useFocusEffect } from '@react-navigation/native';

type Props = NativeStackScreenProps<RootStackParamList, 'GameGoalMode'>;

const BG = require('../assets/background.png');

const BTN_PROGRESS = require('../assets/btn_progres.png');
const BTN_SKIP = require('../assets/btn_skip.png');

const LOGO = require('../assets/logo.png');
const ICON_BACK = require('../assets/icon_back.png');

const HELI = require('../assets/helicopter.png');
const FIELD = require('../assets/game_field.png');

const ICON_LEFT = require('../assets/icon_left.png');
const ICON_RIGHT = require('../assets/icon_right.png');
const ICON_PAUSE = require('../assets/icon_pause.png');
const ICON_PLAY = require('../assets/icon_play.png');

const CUBE_BLUE = require('../assets/cube_blue.png');
const CUBE_YELLOW = require('../assets/cube_yellow.png');
const CUBE_RED = require('../assets/cube_red.png');

type CubeColor = 'blue' | 'yellow' | 'red';
type MatchCounts = Record<CubeColor, number>;

const STORAGE_GOAL_LAST = 'goal_last_result_v1';
const STORAGE_GOAL_TOTAL = 'goal_total_stats_v1';

function CircleBtn({
  size,
  icon,
  onPress,
  disabled,
}: {
  size: number;
  icon: any;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={10}
      android_ripple={Platform.OS === 'android' ? { color: 'rgba(255,255,255,0.12)', borderless: true } : undefined}
      style={{ opacity: disabled ? 0.55 : 1 }}
    >
      <ImageBackground source={BTN_SKIP} style={{ width: size, height: size }} resizeMode="contain">
        <View style={styles.center}>
          <Image source={icon} style={{ width: size * 0.44, height: size * 0.44 }} resizeMode="contain" />
        </View>
      </ImageBackground>
    </Pressable>
  );
}

function pickRandomColor(): CubeColor {
  const r = Math.random();
  if (r < 0.333) return 'blue';
  if (r < 0.666) return 'yellow';
  return 'red';
}

function cubeSource(color: CubeColor) {
  if (color === 'blue') return CUBE_BLUE;
  if (color === 'yellow') return CUBE_YELLOW;
  return CUBE_RED;
}

type Cell = CubeColor | null;

function buildGridFromColumns(colsArr: CubeColor[][], rows: number, cols: number): Cell[][] {
  const grid: Cell[][] = Array.from({ length: rows }, () => Array.from({ length: cols }, () => null));
  for (let c = 0; c < cols; c++) {
    const col = colsArr[c];
    for (let r = 0; r < Math.min(rows, col.length); r++) {
      grid[rows - 1 - r][c] = col[r];
    }
  }
  return grid;
}

function applyRemovalsAndGravity(colsArr: CubeColor[][], rows: number, cols: number, removeMask: boolean[][]) {
  const newCols: CubeColor[][] = Array.from({ length: cols }, () => []);
  for (let c = 0; c < cols; c++) {
    const keep: CubeColor[] = [];
    for (let r = rows - 1; r >= 0; r--) {
      const v = removeMask[r][c]
        ? null
        : (() => {
            const colIndexFromBottom = rows - 1 - r;
            const col = colsArr[c];
            return colIndexFromBottom >= 0 && colIndexFromBottom < col.length ? col[colIndexFromBottom] : null;
          })();
      if (v) keep.push(v);
    }
    newCols[c] = keep;
  }
  return newCols;
}

function findMatches(grid: Cell[][], rows: number, cols: number) {
  const remove: boolean[][] = Array.from({ length: rows }, () => Array.from({ length: cols }, () => false));
  let removedCount: MatchCounts = { blue: 0, yellow: 0, red: 0 };

  for (let r = 0; r < rows; r++) {
    let c = 0;
    while (c < cols) {
      const v = grid[r][c];
      if (!v) {
        c++;
        continue;
      }
      let j = c + 1;
      while (j < cols && grid[r][j] === v) j++;
      const len = j - c;
      if (len >= 3) for (let k = c; k < j; k++) remove[r][k] = true;
      c = j;
    }
  }

  for (let c = 0; c < cols; c++) {
    let r = 0;
    while (r < rows) {
      const v = grid[r][c];
      if (!v) {
        r++;
        continue;
      }
      let j = r + 1;
      while (j < rows && grid[j][c] === v) j++;
      const len = j - r;
      if (len >= 3) for (let k = r; k < j; k++) remove[k][c] = true;
      r = j;
    }
  }

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (remove[r][c]) {
        const v = grid[r][c];
        if (v) removedCount[v] += 1;
      }
    }
  }

  const any = removedCount.blue + removedCount.yellow + removedCount.red > 0;
  return { any, remove, removedCount };
}

function randomGoalTask() {
  const target = pickRandomColor();
  const seconds = 45;
  const goal = 12;

  return { target, seconds, goal };
}

export default function GameGoalModeScreen({ navigation }: Props) {
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
  const IS_SMALL = safeH < 760;

  const s = useMemo(() => {
    const base = safeH / 812;
    return Math.max(0.70, Math.min(1.05, base));
  }, [safeH]);

  const topPad = insets.top + (IS_TINY ? 18 : 30);

  const headH = 56 * s;
  const sideSize = Math.min(W * 0.14, 64) * (IS_TINY ? 0.86 : 1) * s;
  const centerW = Math.min(W * 0.56, 260) * s;
  const centerH = Math.max(44 * s, headH * 0.78);
  const blockW = Math.min(W * 0.92, 430);
  const logoRadius = (sideSize * 0.78) / 2;

  const heliW = Math.min(W * 0.62, 320) * s;
  const heliH = heliW * 0.56;

  const fieldW = Math.min(W * 0.78, 330) * s;
  const fieldH = Math.min(safeH * (IS_TINY ? 0.52 : 0.54), 560) * (IS_TINY ? 0.90 : 1);

  const controlsSize = Math.min(W * 0.15, 70) * (IS_TINY ? 0.86 : 1) * s;
  const controlsGap = (IS_TINY ? 12 : 18) * s;

  const COLS = 5;
  const cell = useMemo(() => fieldW / COLS, [fieldW]);
  const maxRows = useMemo(() => Math.max(8, Math.floor(fieldH / (cell * 0.9))), [fieldH, cell]);

  const speedPxPerSec = useMemo(() => (IS_TINY ? 180 : IS_SMALL ? 205 : 220) * s, [IS_TINY, IS_SMALL, s]);
  const taskRef = useRef<{ target: CubeColor; seconds: number; goal: number }>(randomGoalTask());

  const [started, setStarted] = useState(false);
  const [paused, setPaused] = useState(false);
  const [finished, setFinished] = useState(false);

  const [timeLeft, setTimeLeft] = useState(taskRef.current.seconds);
  const [renderTick, setRenderTick] = useState(0);

  const boardRef = useRef<CubeColor[][]>(Array.from({ length: COLS }, () => []));
  const activeColRef = useRef<number>(Math.floor(COLS / 2));
  const activeYRef = useRef<number>(0);
  const activeColorRef = useRef<CubeColor>('blue');
  const removedRef = useRef<MatchCounts>({ blue: 0, yellow: 0, red: 0 });
  const droppedRef = useRef<number>(0);
  const rafRef = useRef<number | null>(null);
  const lastTRef = useRef<number>(0);
  const aScreen = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    aScreen.setValue(0);
    Animated.timing(aScreen, {
      toValue: 1,
      duration: 420,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [aScreen]);

  const screenAnim = {
    opacity: aScreen,
    transform: [{ translateY: aScreen.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }],
  };

  const resolveMatchesFull = useCallback(() => {
    while (true) {
      const grid = buildGridFromColumns(boardRef.current, maxRows, COLS);
      const { any, remove, removedCount } = findMatches(grid, maxRows, COLS);
      if (!any) break;

      removedRef.current.blue += removedCount.blue;
      removedRef.current.yellow += removedCount.yellow;
      removedRef.current.red += removedCount.red;

      boardRef.current = applyRemovalsAndGravity(boardRef.current, maxRows, COLS, remove);
    }
  }, [COLS, maxRows]);

  const spawnNew = useCallback(() => {
    activeColorRef.current = pickRandomColor();
    activeColRef.current = Math.floor(COLS / 2);
    activeYRef.current = -cell * 0.8;
  }, [COLS, cell]);

  const lockActiveToBoard = useCallback(() => {
    const colIdx = activeColRef.current;
    const color = activeColorRef.current;

    boardRef.current[colIdx].push(color);
    droppedRef.current += 1;

    resolveMatchesFull();

    if (boardRef.current.some((c) => c.length >= maxRows)) {
      setFinished(true);
      setPaused(true);
      return;
    }

    spawnNew();
  }, [maxRows, resolveMatchesFull, spawnNew]);

  const saveGoalResult = useCallback(async (isWin: boolean, timeSpentSec: number) => {
    const removed = removedRef.current;

    const payload = {
      ts: Date.now(),
      mode: 'goal',
      targetColor: taskRef.current.target,
      goalCount: taskRef.current.goal,
      totalSeconds: taskRef.current.seconds,
      timeSpentSec,
      collected: removed[taskRef.current.target],
      removed,
      dropped: droppedRef.current,
      isWin,
    };

    await AsyncStorage.setItem(STORAGE_GOAL_LAST, JSON.stringify(payload));

    const prevRaw = await AsyncStorage.getItem(STORAGE_GOAL_TOTAL);
    const prev = prevRaw
      ? JSON.parse(prevRaw)
      : {
          played: 0,
          wins: 0,
          bestCollected: { blue: 0, yellow: 0, red: 0 },
          totalCollected: { blue: 0, yellow: 0, red: 0 },
        };

    const next = {
      played: (prev.played ?? 0) + 1,
      wins: (prev.wins ?? 0) + (isWin ? 1 : 0),
      bestCollected: {
        blue: Math.max(prev.bestCollected?.blue ?? 0, removed.blue),
        yellow: Math.max(prev.bestCollected?.yellow ?? 0, removed.yellow),
        red: Math.max(prev.bestCollected?.red ?? 0, removed.red),
      },
      totalCollected: {
        blue: (prev.totalCollected?.blue ?? 0) + removed.blue,
        yellow: (prev.totalCollected?.yellow ?? 0) + removed.yellow,
        red: (prev.totalCollected?.red ?? 0) + removed.red,
      },
    };

    await AsyncStorage.setItem(STORAGE_GOAL_TOTAL, JSON.stringify(next));
  }, []);

  const startLoop = useCallback(() => {
    if (rafRef.current) return;
    lastTRef.current = Date.now();

    const step = () => {
      rafRef.current = requestAnimationFrame(step);
      if (!started || paused || finished) return;

      const now = Date.now();
      const dt = Math.min(40, now - lastTRef.current);
      lastTRef.current = now;

      const colIdx = activeColRef.current;
      const colHeight = boardRef.current[colIdx].length;

      const floorY = fieldH - cell * 0.92;
      const landingY = floorY - colHeight * (cell * 0.86);

      activeYRef.current = activeYRef.current + (speedPxPerSec * dt) / 1000;

      if (activeYRef.current >= landingY) {
        activeYRef.current = landingY;
        lockActiveToBoard();
      }

      setRenderTick((v) => v + 1);
    };

    rafRef.current = requestAnimationFrame(step);
  }, [started, paused, finished, fieldH, cell, speedPxPerSec, lockActiveToBoard]);

  const stopLoop = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (started && !paused && !finished) startLoop();
    if (paused || finished) stopLoop();
    return () => stopLoop();
  }, [started, paused, finished, startLoop, stopLoop]);

  useEffect(() => {
    if (!started || paused || finished) return;

    const t = setInterval(() => {
      setTimeLeft((v) => (v <= 1 ? 0 : v - 1));
    }, 1000);

    return () => clearInterval(t);
  }, [started, paused, finished]);

  useEffect(() => {
    if (!started || finished) return;

    const { target, goal, seconds } = taskRef.current;
    const collected = removedRef.current[target];
    if (collected >= goal) {
      setFinished(true);
      setPaused(true);
      saveGoalResult(true, Math.max(0, seconds - timeLeft));
      return;
    }

    if (timeLeft <= 0) {
      setFinished(true);
      setPaused(true);
      saveGoalResult(collected >= goal, seconds);
    }
  }, [finished, saveGoalResult, started, timeLeft]);

  const onStart = () => {
    taskRef.current = randomGoalTask();

    boardRef.current = Array.from({ length: COLS }, () => []);
    removedRef.current = { blue: 0, yellow: 0, red: 0 };
    droppedRef.current = 0;

    setTimeLeft(taskRef.current.seconds);
    setFinished(false);
    setPaused(false);
    setStarted(true);

    spawnNew();
    setRenderTick((v) => v + 1);
  };

  const onTogglePause = () => {
    if (!started) return;
    if (finished) return;
    setPaused((v) => !v);
  };

  const onLeft = () => {
    if (!started || paused || finished) return;
    activeColRef.current = Math.max(0, activeColRef.current - 1);
    setRenderTick((v) => v + 1);
  };

  const onRight = () => {
    if (!started || paused || finished) return;
    activeColRef.current = Math.min(COLS - 1, activeColRef.current + 1);
    setRenderTick((v) => v + 1);
  };

  const activeX = useMemo(() => {
    const colIdx = activeColRef.current;
    return colIdx * cell + cell / 2;
  }, [renderTick, cell]);

  const cubeSize = Math.max(cell * 0.55, 24);
  const cubeTopLeftX = activeX - cubeSize / 2;
  const floorY = fieldH - cell * 0.92;
  const resultCardW = Math.min(fieldW * 0.92, 360);
  const resultCardH = Math.min(safeH * (IS_TINY ? 0.34 : 0.30), 290);

  const rowH = Math.max((IS_TINY ? 34 : 36) * s, 30);
  const iconSz = Math.max(26 * s, 22);

  const targetColor = taskRef.current.target;
  const goalCount = taskRef.current.goal;
  const totalSeconds = taskRef.current.seconds;

  const collectedNow = removedRef.current[targetColor];
  const showDim = finished;
  const isWinNow = finished ? collectedNow >= goalCount : collectedNow >= goalCount;

  return (
    <ImageBackground source={BG} style={styles.bg} resizeMode="cover">
      <View style={[styles.wrap, { paddingTop: topPad, paddingBottom: insets.bottom + (IS_TINY ? 8 : 18) }]}>
        {showDim && <View pointerEvents="none" style={styles.dim} />}
        <Animated.View style={[styles.headerRow, { height: headH, width: blockW }, screenAnim]}>
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
                    borderRadius: logoRadius,
                    overflow: 'hidden',
                  }}
                >
                  <Image source={LOGO} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                </View>
              </View>
            </ImageBackground>
          </View>
        </Animated.View>

        <View style={{ height: (IS_TINY ? 6 : 12) * s }} />
        <Animated.View style={[styles.gameArea, screenAnim]}>
          <Image source={HELI} style={{ width: heliW, height: heliH }} resizeMode="contain" />
          <View style={{ height: 8 * s }} />
          <View style={[styles.goalBar, { width: Math.min(fieldW * 0.92, 360), paddingVertical: 10 * s }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Image source={cubeSource(targetColor)} style={{ width: 26 * s, height: 26 * s }} resizeMode="contain" />
                <Text style={[styles.goalText, { fontSize: 13.5 * s }]}>
                  Collect: {collectedNow}/{goalCount}
                </Text>
              </View>

              <Text style={[styles.timeText, { fontSize: 13.5 * s }]}>Time: {timeLeft}s</Text>
            </View>
          </View>

          <View style={{ height: 10 * s }} />
          <View style={{ width: fieldW, height: fieldH, alignItems: 'center', justifyContent: 'center' }}>
            <Image source={FIELD} style={{ width: fieldW, height: fieldH }} resizeMode="stretch" />

            <View style={styles.fieldOverlay} pointerEvents="none">
              {boardRef.current.map((col, colIdx) =>
                col.map((color, i) => {
                  const x = colIdx * cell + cell / 2 - cubeSize / 2;
                  const y = floorY - i * (cell * 0.86) - cubeSize / 2;
                  return (
                    <Image
                      key={`${colIdx}-${i}-${color}`}
                      source={cubeSource(color)}
                      style={{ position: 'absolute', left: x, top: y, width: cubeSize, height: cubeSize }}
                      resizeMode="contain"
                    />
                  );
                })
              )}

              {started && !finished && (
                <Image
                  source={cubeSource(activeColorRef.current)}
                  style={{ position: 'absolute', left: cubeTopLeftX, top: activeYRef.current, width: cubeSize, height: cubeSize }}
                  resizeMode="contain"
                />
              )}
            </View>

            {!started && (
              <View style={styles.startOverlay} pointerEvents="box-none">
                <Pressable
                  onPress={onStart}
                  hitSlop={10}
                  android_ripple={Platform.OS === 'android' ? { color: 'rgba(255,255,255,0.10)' } : undefined}
                  style={{ alignItems: 'center' }}
                >
                  <ImageBackground
                    source={BTN_PROGRESS}
                    style={{ width: Math.min(fieldW * 0.44, 170) * s, height: Math.min(fieldW * 0.18, 64) * s }}
                    resizeMode="contain"
                  >
                    <View style={styles.center}>
                      <Text style={[styles.startText, { fontSize: 16 * s }]}>Start</Text>
                    </View>
                  </ImageBackground>
                </Pressable>
              </View>
            )}

            {finished && (
              <View style={styles.resultOverlay} pointerEvents="box-none">
                <View style={{ alignItems: 'center' }}>
                  <ImageBackground
                    source={BTN_PROGRESS}
                    style={{ width: Math.min(fieldW * 0.62, 240) * s, height: Math.min(fieldW * 0.20, 78) * s }}
                    resizeMode="contain"
                  >
                    <View style={styles.center}>
                      <Text style={[styles.resultTitle, { fontSize: 16 * s }]}>Result</Text>
                    </View>
                  </ImageBackground>

                  <View style={{ height: 10 * s }} />

                  <View
                    style={[
                      styles.resultCard,
                      {
                        width: resultCardW,
                        height: resultCardH,
                        paddingHorizontal: 18 * s,
                        paddingVertical: 16 * s,
                      },
                    ]}
                  >
                    <View style={[styles.resRow, { height: rowH }]}>
                      <View style={styles.leftRes}>
                        <Image source={cubeSource(targetColor)} style={{ width: iconSz, height: iconSz }} resizeMode="contain" />
                        <Text style={[styles.resLabel, { fontSize: 13.5 * s }]}>Target</Text>
                      </View>
                      <Text style={[styles.resNum, { fontSize: 16 * s }]}>{collectedNow}</Text>
                    </View>

                    <View style={[styles.resRow, { height: rowH }]}>
                      <Text style={[styles.resLabel, { fontSize: 13.5 * s }]}>Goal</Text>
                      <Text style={[styles.resNum, { fontSize: 16 * s }]}>{goalCount}</Text>
                    </View>

                    <View style={[styles.resRow, { height: rowH }]}>
                      <Text style={[styles.resLabel, { fontSize: 13.5 * s }]}>Time used</Text>
                      <Text style={[styles.resNum, { fontSize: 16 * s }]}>{Math.max(0, totalSeconds - timeLeft)}s</Text>
                    </View>

                    <View style={{ flex: 1 }} />

                    <Text style={[styles.winnerText, { fontSize: 12.5 * s }]}>
                      {isWinNow ? 'SUCCESS ✅' : 'FAILED ❌'}
                    </Text>
                  </View>

                  <View style={{ height: 14 * s }} />

                  <Pressable onPress={onStart} hitSlop={10} style={{ alignItems: 'center' }}>
                    <ImageBackground
                      source={BTN_PROGRESS}
                      style={{ width: Math.min(fieldW * 0.44, 170) * s, height: Math.min(fieldW * 0.18, 64) * s }}
                      resizeMode="contain"
                    >
                      <View style={styles.center}>
                        <Text style={[styles.startText, { fontSize: 16 * s }]}>Replay</Text>
                      </View>
                    </ImageBackground>
                  </Pressable>
                </View>
              </View>
            )}
          </View>
        </Animated.View>

        <View style={{ flex: 1 }} />

        <Animated.View style={[styles.controlsRow, { marginTop: 10 * s }, screenAnim]}>
          <CircleBtn size={controlsSize} icon={ICON_LEFT} onPress={onLeft} disabled={!started || paused || finished} />
          <View style={{ width: controlsGap }} />
          <CircleBtn
            size={controlsSize}
            icon={paused || !started ? ICON_PLAY : ICON_PAUSE}
            onPress={onTogglePause}
            disabled={!started || finished}
          />
          <View style={{ width: controlsGap }} />
          <CircleBtn size={controlsSize} icon={ICON_RIGHT} onPress={onRight} disabled={!started || paused || finished} />
        </Animated.View>
      </View>
    </ImageBackground>
  );
} 

const styles = StyleSheet.create({
  bg: { flex: 1 },
  wrap: { flex: 1, alignItems: 'center' },

  dim: {
    position: 'absolute',
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },

  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  headTitle: { color: '#163A86', fontWeight: '900', letterSpacing: 0.2 },

  gameArea: { alignItems: 'center', justifyContent: 'flex-start' },
  fieldOverlay: { position: 'absolute', left: 0, top: 0, width: '100%', height: '100%' },

  goalBar: {
    backgroundColor: 'rgba(210, 235, 255, 0.92)',
    borderRadius: 18,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.85)',
    paddingHorizontal: 14,
    shadowColor: '#000',
    shadowOpacity: 0.14,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 5,
  },
  goalText: { color: '#163A86', fontWeight: '900' },
  timeText: { color: '#163A86', fontWeight: '900' },

  startOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },

  resultOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },

  startText: { color: '#163A86', fontWeight: '900', letterSpacing: 0.3 },
  resultTitle: { color: '#163A86', fontWeight: '900', letterSpacing: 0.3 },

  resultCard: {
    backgroundColor: 'rgba(210, 235, 255, 0.95)',
    borderRadius: 18,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.85)',
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },

  resRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  leftRes: { flexDirection: 'row', alignItems: 'center', gap: 10 },

  resLabel: { color: '#163A86', fontWeight: '800' },
  resNum: { color: '#163A86', fontWeight: '900', letterSpacing: 0.2 },

  winnerText: { color: '#163A86', fontWeight: '900', textAlign: 'center', opacity: 0.95 },

  controlsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
});
