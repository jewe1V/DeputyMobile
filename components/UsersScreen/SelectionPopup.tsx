import React, { useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    Animated,
    PanResponder,
    Dimensions,
    FlatList,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface SelectionPopupProps {
    visible: boolean;
    title: string;
    onClose: () => void;
    data: any[];
    onSelect: (item: any) => void;
    renderItem?: (item: any) => React.ReactElement;
    keyExtractor: (item: any) => string;
}

export const SelectionPopup: React.FC<SelectionPopupProps> = ({
                                                                  visible,
                                                                  title,
                                                                  onClose,
                                                                  data,
                                                                  onSelect,
                                                                  renderItem,
                                                                  keyExtractor
                                                              }) => {
    const { colors, isDark } = useTheme();
    const insets = useSafeAreaInsets();
    const SHEET_HEIGHT = SCREEN_HEIGHT * 0.8;
    const panY = useRef(new Animated.Value(SHEET_HEIGHT)).current;

    const openAnim = Animated.timing(panY, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
    });

    const closeAnim = (callback?: () => void) => Animated.timing(panY, {
        toValue: SHEET_HEIGHT,
        duration: 250,
        useNativeDriver: true,
    }).start(callback);

    const handleClose = () => closeAnim(onClose);

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: (_, gestureState) => gestureState.dy > 5,
            onPanResponderMove: (_, gestureState) => {
                if (gestureState.dy > 0) panY.setValue(gestureState.dy);
            },
            onPanResponderRelease: (_, gestureState) => {
                if (gestureState.dy > 120) handleClose();
                else openAnim.start();
            },
        })
    ).current;

    useEffect(() => {
        if (visible) openAnim.start();
    }, [visible]);

    const defaultRenderItem = ({ item }: { item: any }) => (
        <TouchableOpacity
            style={[styles.item, { borderBottomColor: colors.divider }]}
            onPress={() => {
                onSelect(item);
                handleClose();
            }}
        >
            <Text style={[styles.itemText, { color: colors.text }]}>{item.toString()}</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.subtext} />
        </TouchableOpacity>
    );

    return (
        <Modal visible={visible} transparent animationType="none" onRequestClose={handleClose}>
            <View style={styles.overlay}>
                <TouchableOpacity style={styles.dismiss} activeOpacity={1} onPress={handleClose} />
                <Animated.View
                    style={[
                        styles.sheet,
                        { transform: [{ translateY: panY }], height: SHEET_HEIGHT, paddingBottom: insets.bottom, backgroundColor: colors.card }
                    ]}
                >
                    <View {...panResponder.panHandlers} style={styles.dragArea}>
                        <View style={[styles.dragIndicator, { backgroundColor: colors.border }]} />
                        <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
                    </View>
                    <FlatList
                        data={data}
                        keyExtractor={keyExtractor}
                        renderItem={renderItem ? (info) => (
                            <TouchableOpacity onPress={() => { onSelect(info.item); handleClose(); }}>
                                {renderItem(info.item)}
                            </TouchableOpacity>
                        ) : defaultRenderItem}
                        contentContainerStyle={styles.list}
                    />
                </Animated.View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
    dismiss: { ...StyleSheet.absoluteFillObject },
    sheet: { backgroundColor: '#fff', borderTopLeftRadius: 32, borderTopRightRadius: 32, width: '100%' },
    dragArea: { paddingTop: 12, paddingBottom: 16, alignItems: 'center' },
    dragIndicator: { width: 38, height: 5, backgroundColor: '#E5E7EB', borderRadius: 3, marginBottom: 12 },
    title: { fontSize: 18, fontWeight: '700', color: '#1e293b' },
    list: { paddingHorizontal: 20, paddingBottom: 20 },
    item: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6'
    },
    itemText: { fontSize: 16, color: '#374151', fontWeight: '500' }
});
