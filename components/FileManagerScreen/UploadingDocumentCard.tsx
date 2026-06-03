import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import {File, X} from 'lucide-react-native';
import { styles } from './file-manager-screen';
import {LinearGradient} from "expo-linear-gradient";
import { useTheme } from '@/context/ThemeContext';

interface UploadingDocumentCardProps {
    progress: number;
    onCancel: () => void;
}

export function UploadingDocumentCard({ progress, onCancel }: UploadingDocumentCardProps) {
    const { colors, isDark } = useTheme();
    const progressPercent = Math.round(progress * 50);

    return (
        <View style={[styles.documentItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.documentContent}>
                {/* Иконка загружаемого файла */}
                <View style={[styles.documentIconContainer, { backgroundColor: isDark ? colors.iconBox : '#f9fafb', justifyContent: 'center', alignItems: 'center' }]}>
                    <File size={20} color={colors.subtext} />
                </View>

                <View style={styles.documentInfo}>
                    <Text style={[styles.documentName, { color: colors.text }]} numberOfLines={1}>
                        Загрузка файла...
                    </Text>

                    <View style={{ height: 5, backgroundColor: isDark ? colors.divider : '#e5e7eb', borderRadius: 6, marginTop: 4, overflow: 'hidden' }}>
                        <LinearGradient
                            colors={[colors.primary, colors.secondary]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={{
                                width: `${progressPercent}%`,
                                height: '100%',
                            }}
                        >
                        </LinearGradient>

                    </View>

                    <Text style={[styles.documentMetaText, { color: colors.subtext, marginTop: 4 }]}>
                        {progressPercent}%
                    </Text>
                </View>

                {/* Кнопка отмены */}
                <TouchableOpacity
                    style={styles.documentActionButton}
                    onPress={onCancel}
                >
                    <View pointerEvents="none">
                        <X size={18} color={colors.text} />
                    </View>
                </TouchableOpacity>
            </View>
        </View>
    );
}
