import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ImageBackground,
  Image,
  Dimensions,
  FlatList,
  BackHandler,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePreventRemove } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'CollectionNoData'>;

const STORAGE_KEY = 'collection_unlocked_cards_v1';
const BG = require('../assets/background2.png');
const BTN_SKIP = require('../assets/btn_skip.png');
const ICON_BACK = require('../assets/icon_back.png');
const BTN_TITLE = require('../assets/btn_progres.png');
const LOGO = require('../assets/logo.png');

const { width: W, height: H } = Dimensions.get('window');

type ColorType = 'red' | 'blue' | 'yellow';

const CARD_DEFS = {
  blue_1: { id: 'blue_1', img: require('../assets/wp_blue_1.png') },
  blue_2: { id: 'blue_2', img: require('../assets/wp_blue_2.png') },
  blue_3: { id: 'blue_3', img: require('../assets/wp_blue_3.png') },
  yellow_1: { id: 'yellow_1', img: require('../assets/wp_yellow_1.png') },
  yellow_2: { id: 'yellow_2', img: require('../assets/wp_yellow_2.png') },
  yellow_3: { id: 'yellow_3', img: require('../assets/wp_yellow_3.png') },
  red_1: { id: 'red_1', img: require('../assets/wp_red_1.png') },
  red_2: { id: 'red_2', img: require('../assets/wp_red_2.png') },
  red_3: { id: 'red_3', img: require('../assets/wp_red_3.png') },
} as const;

type CardId = keyof typeof CARD_DEFS;

type StoredUnlockedItem = {
  id: CardId;
  color: ColorType;
  unlockedAt: number;
};

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

export default function CollectionScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [unlockedItems, setUnlockedItems] = useState<StoredUnlockedItem[]>([]);
  const [selectedColor, setSelectedColor] = useState<ColorType>('red');
  const allowExitRef = useRef(false);
  useEffect(() => {
    navigation.setOptions({ gestureEnabled: false });
  }, [navigation]);
  const onBackPress = useCallback(() => {
    allowExitRef.current = true;
    navigation.goBack();
    setTimeout(() => {
      allowExitRef.current = false;
    }, 500);
  }, [navigation]);

  usePreventRemove(!allowExitRef.current, (event) => {
    if (allowExitRef.current) {
      navigation.dispatch(event.data.action);
    }
  });

  useEffect(() => {
    const bh = BackHandler.addEventListener('hardwareBackPress', () => {
      onBackPress();
      return true;
    });
    return () => bh.remove();
  }, [onBackPress]);
  const safeH = Math.max(1, H - insets.top - insets.bottom);
  const IS_TINY = safeH < 700;
  const s = useMemo(() => clamp(safeH / 812, 0.75, 1), [safeH]);

  const headBtn = 50 * s;
  const titleW = 180 * s;
  const titleH = 45 * s;
  const tabSize = (IS_TINY ? 66 : 75) * s;
  const tabIcon = (IS_TINY ? 48 : 55) * s;
  const listPadH = 20 * s;
  const listPadBottom = (IS_TINY ? 24 : 40) * s;
  const rowGap = (IS_TINY ? 12 : 15) * s;
  const cardPad = 8 * s;
  const cardRadius = 20 * s;
  const innerRadius = 12 * s;
  const cardBorder = 2 * s;

  const columnW = useMemo(() => {
    const total = W - listPadH * 2 - rowGap;
    return total / 2;
  }, [listPadH, rowGap]);

  useEffect(() => {
    const load = async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed: StoredUnlockedItem[] = JSON.parse(raw);
          setUnlockedItems(parsed.sort((a, b) => b.unlockedAt - a.unlockedAt));
        } else {
          setUnlockedItems([]);
        }
      } catch (e) {
        setUnlockedItems([]);
      }
    };
    const unsubscribe = navigation.addListener('focus', load);
    return unsubscribe;
  }, [navigation]);

  const filteredItems = useMemo(() => {
    return unlockedItems.filter((item) => item.color === selectedColor);
  }, [unlockedItems, selectedColor]);

  const renderCard = ({ item }: { item: StoredUnlockedItem }) => {
    const def = CARD_DEFS[item.id];
    if (!def) return null;
    return (
      <View style={[styles.cardFrame, { width: columnW, padding: cardPad, borderRadius: cardRadius, borderWidth: cardBorder }]}>
        <Image source={def.img} style={[styles.cardImage, { borderRadius: innerRadius }]} resizeMode="cover" />
      </View>
    );
  };

  return (
    <ImageBackground source={BG} style={styles.bg} resizeMode="cover">
      <View style={[styles.root, { paddingTop: insets.top + 10 * s }]}>
        <View style={[styles.header, { width: '92%' }]}>
          <Pressable onPress={onBackPress}>
            <ImageBackground source={BTN_SKIP} style={{ width: headBtn, height: headBtn, justifyContent: 'center', alignItems: 'center' }}>
              <Image source={ICON_BACK} style={{ width: 22 * s, height: 22 * s }} resizeMode="contain" />
            </ImageBackground>
          </Pressable>

          <ImageBackground source={BTN_TITLE} style={{ width: titleW, height: titleH, justifyContent: 'center', alignItems: 'center' }}>
            <Text style={[styles.titleText, { fontSize: 18 * s }]}>Collection</Text>
          </ImageBackground>

          <Image source={LOGO} style={{ width: headBtn, height: headBtn, borderRadius: headBtn / 2 }} />
        </View>

        <View style={[styles.tabs, { marginTop: 20 * s, width: '85%', marginBottom: 10 * s }]}>
          {(['red', 'blue', 'yellow'] as ColorType[]).map((color) => (
            <Pressable
              key={color}
              onPress={() => setSelectedColor(color)}
              style={[
                styles.tabItem,
                { width: tabSize, height: tabSize, borderRadius: 15 * s },
                selectedColor === color && styles.tabActive,
              ]}
            >
              <Image
                source={
                  color === 'red'
                    ? require('../assets/cube_red.png')
                    : color === 'blue'
                    ? require('../assets/cube_blue.png')
                    : require('../assets/cube_yellow.png')
                }
                style={{ width: tabIcon, height: tabIcon }}
              />
            </Pressable>
          ))}
        </View>

        <View style={styles.content}>
          {filteredItems.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={[styles.noData, { fontSize: 18 * s, paddingHorizontal: 40 * s }]}>
                You have no collection for this category...
              </Text>
            </View>
          ) : (
            <FlatList
              data={filteredItems}
              renderItem={renderCard}
              keyExtractor={(item) => `${item.id}_${item.unlockedAt}`}
              numColumns={2}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{
                paddingHorizontal: listPadH,
                paddingBottom: listPadBottom,
                paddingTop: 10 * s,
              }}
              columnWrapperStyle={{ justifyContent: 'space-between', marginBottom: rowGap }}
            />
          )}
        </View>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1 },
  root: { flex: 1, alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  titleText: { color: '#163A86', fontWeight: '900' },
  tabs: { flexDirection: 'row', justifyContent: 'space-between' },
  tabItem: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  tabActive: { borderColor: '#FFD700', backgroundColor: 'rgba(255,255,255,0.4)' },
  content: { flex: 1, width: '100%' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  noData: { color: '#163A86', fontWeight: '700', textAlign: 'center' },
  cardFrame: {
    aspectRatio: 0.8,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderColor: '#FFD700',
    overflow: 'hidden',
  },
  cardImage: { width: '100%', height: '100%' },
});