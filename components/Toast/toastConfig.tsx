import BlurView from 'expo-blur/build/BlurView';
import React from 'react';
import {View, Text, StyleSheet, Dimensions} from 'react-native';
import { ToastConfig, BaseToastProps } from 'react-native-toast-message';
import {AlertTriangle, Calendar, Clock, Icon} from "lucide-react-native";
import {formatDateShort} from "@/utils";

interface CustomToastProps extends BaseToastProps {
    props: {
        title: string;
        time: string;
    };
}
const { width } = Dimensions.get('window');

export const toastConfig: ToastConfig = {
    customNotification: ({ text1, props }: CustomToastProps) => {
        const isEvent = text1?.includes('🔔');
        const accentColor = isEvent ? '#22C55E' : '#F59E0B';

        return (
            <BlurView
                style={styles.container}
            >
                <View style={styles.content}>
                    <View style={[styles.iconCircle, { backgroundColor: `${accentColor}15` }]}>
                        {isEvent ? (
                            <Calendar color={accentColor} size={24} strokeWidth={2} />
                        ) : (
                            <AlertTriangle color={accentColor} size={24} strokeWidth={2} />
                        )}
                    </View>

                    <View style={styles.textSection}>
                        <Text style={styles.header}>
                            {isEvent ? 'Напоминание о событии' : 'Напоминание о дедлайне'}
                        </Text>
                        <Text style={styles.title}>{props.title}</Text>

                        <View style={styles.timeContainer}>
                            <Clock color="#64748B" size={12}  />
                            <Text style={styles.time}>{formatDateShort(props.time)}</Text>
                        </View>
                    </View>
                </View>
            </BlurView>
        );
    }
};

const styles = StyleSheet.create({
    container: {
        width: width - 32,
        marginHorizontal: 16,
        borderRadius: 20,
        overflow: 'hidden',
        backgroundColor: 'rgba(255, 255, 255, 0.85)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.5)',
        // Тень для iOS
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        // Тень для Android
        elevation: 8,
    },
    content: {
        flexDirection: 'row',
        padding: 4,
        alignItems: 'center',
        gap: 12,
    },
    iconCircle: {
        width: 48,
        height: 48,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    textSection: {
        flex: 1,
        gap: 4,
    },
    header: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1E293B',
    },
    title: {
        fontSize: 16,
        fontWeight: '700',
        color: '#0F172A',
        marginTop: -5,
    },
    timeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    time: {
        fontSize: 13,
        color: '#46494e',
        fontWeight: '400',
    }
});
