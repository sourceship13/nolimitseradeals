import React, { useMemo, useRef, useState } from 'react';

import { useRoute, useNavigation } from '@react-navigation/native';
import { getColors } from '../../libs/colors';
import { useAuth } from '../../libs/hooks/useAuth';
import Toolbar from '../../components/Toolbar';
import { iOSUIKit } from 'react-native-typography';
import {
  BarcodeCreatorView,
  BarcodeFormat,
} from 'react-native-barcode-creator';
import Barcode from 'react-native-barcode-builder';

import {
  FlatList,
  View,
  Text,
  LayoutChangeEvent,
  NativeScrollEvent,
  NativeSyntheticEvent,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';

type Item = {
  id: string;
  label: string;
  payload: string;
  format: keyof typeof BarcodeFormat;
};

const DATA: Item[] = [
  // CODE128 accepts arbitrary strings/digits
  {
    id: '1',
    label: 'Order #1001',
    payload: '1001-ACME-XYZ',
    format: BarcodeFormat.CODE128,
  },
  // EAN13 must be 13 digits (use helper below if you only have 12)
  {
    id: '2',
    label: 'EAN-13',
    payload: '5901234123457',
    format: BarcodeFormat.EAN13,
  },
 
];

const RedemptionScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { isDarkMode } = useAuth();
  const colors = getColors(isDarkMode);
  const { code, deal } = route.params || {};

  const listRef = useRef<FlatList<Item>>(null);
  const [containerW, setContainerW] = useState(0);


  // Fallback code if not provided
  const redemptionCode = code || deal?.redemption_code || 'ABC123';


  const CARD_W = 260; // visible card width
  const SPACING = 16; // space between cards
  const INTERVAL = CARD_W + SPACING;

  // compute left offsets for each item (including spacing)
  const leftOffsets = useMemo(() => {
    const arr: number[] = [];
    let x = 0;
    DATA.forEach((it, i) => {
      if (i > 0) x += SPACING; // separator
      arr.push(x); // left edge of this item
      x += it.w;
    });
    return arr;
  }, []);

  // offsets that center each item: left + (itemW/2) - (containerW/2)
  const snapToOffsets = useMemo(() => {
    if (!containerW) return [];
    return DATA.map((it, i) =>
      Math.max(0, leftOffsets[i] + it.w / 2 - containerW / 2),
    );
  }, [containerW, leftOffsets]);

  const onLayout = (e: LayoutChangeEvent) =>
    setContainerW(e.nativeEvent.layout.width);

  // (optional) know the centered index after snap
  const onMomentumScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const x = e.nativeEvent.contentOffset.x;
    // find nearest snap offset
    const idx = snapToOffsets.reduce(
      (best, off, i) =>
        Math.abs(off - x) < Math.abs(snapToOffsets[best] - x) ? i : best,
      0,
    );
    // console.log('Centered index:', idx);
  };

  const sidePad = Math.max(0, (containerW - (DATA[0]?.w ?? 0)) / 2);
  const endPad = Math.max(0, (containerW - (DATA.at(-1)?.w ?? 0)) / 2);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Toolbar
        title="Redeem Deal"
        onBack={() => navigation.goBack()}
        showSettings={false}
      />
      <View style={styles.container}>
        <Text
          style={[
            iOSUIKit.title3Emphasized,
            { color: colors.text, marginBottom: 16 },
          ]}
        >
          Show this code to the business
        </Text>
        <View style={styles.codeBox}>
          <Text
            style={[iOSUIKit.largeTitleEmphasized, { color: colors.primary }]}
          >
            {redemptionCode}
          </Text>
        </View>
        <Text
          style={[iOSUIKit.body, { color: colors.text, marginVertical: 16 }]}
        >
          Or scan this QR code:
        </Text>
        <View style={styles.qrBox}>
          <FlatList
            ref={listRef}
            horizontal
            data={DATA}
            keyExtractor={i => i.id}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: sidePad }}
            ItemSeparatorComponent={() => <View style={{ width: SPACING }} />}
            renderItem={({ item }) => (
              <View
                style={{
                  width: CARD_W,
                  height: 180,
                  borderRadius: 14,
                  backgroundColor: '#FFF',
                  borderWidth: 1,
                  borderColor: '#E6E6E6',
                  padding: 12,
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <Text style={{ fontWeight: '600' }}>{item.label}</Text>

                {/* The barcode scales to the view size you give it */}
                <BarcodeCreatorView
                  value={item.payload}
                  format={item.format}
                  background={'#FFFFFF'}
                  foregroundColor={'#000000'}
                  style={{ width: CARD_W - 24, height: 120 }}
                />

                <Text style={{ color: '#666' }}>{item.payload}</Text>
              </View>
            )}
            // 🔑 center-snapping
            snapToAlignment="center"
            // snapToInterval={INTERVAL}
            decelerationRate="normal"
            disableIntervalMomentum

            // perf: exact measurements for RN
            getItemLayout={(_, index) => ({
              length: INTERVAL,
              offset: INTERVAL * index,
              index,
            })}
          />
        </View>
        <TouchableOpacity
          style={[styles.doneBtn, { backgroundColor: colors.primary }]}
          onPress={() => navigation.goBack()}
        >
          <Text style={[iOSUIKit.title3, { color: colors.background }]}>
            Done
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  box: {
    width: 180,
    height: 180,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  codeBox: {
    padding: 24,
    borderRadius: 12,
    backgroundColor: '#fff',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  qrBox: {
    marginVertical: 16,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
    height: 200,
    width: 300,
    justifyContent: 'center',
    alignItems: 'center',
  },
  doneBtn: {
    marginTop: 32,
    paddingVertical: 14,
    paddingHorizontal: 48,
    borderRadius: 24,
    alignItems: 'center',
  },
});

export default RedemptionScreen;
