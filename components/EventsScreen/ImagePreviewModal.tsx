import React, { useEffect, useState } from 'react';
import { Modal, View, TouchableOpacity, Image, Text, Platform } from 'react-native';
import { X, Download } from 'lucide-react-native';
import { AuthManager } from "@/api/auth";
import { apiUrl } from '@/api/api';
import {xAppSecret} from '@/api/auth';
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface ImagePreviewModalProps {
    visible: boolean;
    onClose: () => void;
    fileName: string | null;
    onDownload?: () => void;
}

export const ImagePreviewModal: React.FC<ImagePreviewModalProps> = ({
                                                                        visible,
                                                                        onClose,
                                                                        fileName,
                                                                        onDownload
                                                                    }) => {
    const insets = useSafeAreaInsets();
    const [webPreviewUrl, setWebPreviewUrl] = useState<string | null>(null);
    const token = AuthManager.getToken();

    const imageUrl = fileName ? `${apiUrl}/api/files/${encodeURIComponent(fileName)}` : null;
    const imageHeaders = {
        Authorization: `Bearer ${token}`,
        'X-App-Secret': xAppSecret
    };

    useEffect(() => {
        if (Platform.OS === 'web' && visible && fileName && imageUrl) {
            let isMounted = true;

            const fetchImageForWeb = async () => {
                try {
                    const response = await fetch(imageUrl, { headers: imageHeaders });
                    if (!response.ok) throw new Error('Failed to fetch image');

                    const blob = await response.blob();
                    const objectUrl = URL.createObjectURL(blob);

                    if (isMounted) {
                        setWebPreviewUrl(objectUrl);
                    }
                } catch (error) {
                    console.error('Error loading image preview for web:', error);
                }
            };

            fetchImageForWeb();

            return () => {
                isMounted = false;
                if (webPreviewUrl) {
                    URL.revokeObjectURL(webPreviewUrl);
                }
            };
        }
    }, [visible, fileName, imageUrl]);

    const imageSource = Platform.OS === 'web'
        ? { uri: webPreviewUrl || undefined }
        : {
            uri: imageUrl || undefined,
            headers: imageHeaders
        };

    if (!fileName) return null;

    return (
        <Modal
            visible={visible}
            transparent={true}
            onRequestClose={onClose}
            animationType="fade"
        >
            <View style={styles.overlay}>
                <TouchableOpacity
                    style={styles.closeButton}
                    onPress={onClose}
                >
                    <View pointerEvents="none">
                        <X size={30} color="white" />
                    </View>
                </TouchableOpacity>

                {imageUrl && (
                    <Image
                        source={imageSource}
                        style={styles.image}
                        resizeMode="contain"
                    />
                )}

                <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
                    <Text style={styles.fileName} numberOfLines={1}>{fileName}</Text>
                    {onDownload && (
                        <TouchableOpacity
                            style={styles.downloadButton}
                            onPress={() => {
                                onDownload();
                                onClose();
                            }}
                        >
                            <Download size={20} color="white" />
                            <Text style={styles.downloadButtonText}>Загрузить</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        </Modal>
    );
};

const styles = {
    overlay: {
        flex: 1,
        backgroundColor: 'black',
        justifyContent: 'center',
        alignItems: 'center'
    },
    closeButton: {
        position: 'absolute',
        top: 50,
        right: 20,
        zIndex: 10,
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderRadius: 20,
        padding: 8
    },
    image: {
        width: '100%',
        height: '80%'
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(0,0,0,0.7)',
        padding: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    fileName: {
        color: 'white',
        fontSize: 16,
        fontWeight: '500',
        flex: 1
    },
    downloadButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#0f6319',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 8,
        marginLeft: 12,
        gap: 8
    },
    downloadButtonText: {
        color: 'white',
        fontSize: 14,
        fontWeight: '600'
    }
};
