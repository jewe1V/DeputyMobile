import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import {FileText, File, X} from 'lucide-react-native';
import { styles } from './file-manager-screen';
import {LinearGradient} from "expo-linear-gradient";

interface UploadingDocumentCardProps {
    progress: number;
    onCancel: () => void;
}

export function UploadingDocumentCard({ progress, onCancel }: UploadingDocumentCardProps) {
    const progressPercent = Math.round(progress * 50);

    return (
        <View style={styles.documentItem}>
            <View style={styles.documentContent}>
                {/* Иконка загружаемого файла */}
                <View style={[styles.documentIconContainer, { backgroundColor: '#f9fafb', justifyContent: 'center', alignItems: 'center' }]}>
                    <File size={20} color="#6b7280" />
                </View>

                <View style={styles.documentInfo}>
                    <Text style={styles.documentName} numberOfLines={1}>
                        Загрузка файла...
                    </Text>

                    <View style={{ height: 5, backgroundColor: '#e5e7eb', borderRadius: 6, marginTop: 4, overflow: 'hidden' }}>
                        <LinearGradient
                            colors={['#2A6E3F', '#349339', '#309f35']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={{
                                width: `${progressPercent}%`,
                                height: '100%',
                            }}
                        >
                        </LinearGradient>

                    </View>

                    <Text style={[styles.documentMetaText, { marginTop: 4 }]}>
                        {progressPercent}%
                    </Text>
                </View>

                {/* Кнопка отмены */}
                <TouchableOpacity
                    style={styles.documentActionButton}
                    onPress={onCancel}
                >
                    <View pointerEvents="none">
                        <X size={18} color="#000" />
                    </View>
                </TouchableOpacity>
            </View>
        </View>
    );
}
