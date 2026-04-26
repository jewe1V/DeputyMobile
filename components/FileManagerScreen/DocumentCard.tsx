import { CatalogItem } from '@/api/catalogService';
import { Document } from "@/api/documentService"
import { Info } from 'lucide-react-native';
import { Text, TouchableOpacity, View, Image, Platform } from 'react-native'; // Добавили Platform
import { styles } from './file-manager-screen';
import { JSX, useState, useEffect } from 'react'; // Добавили useState и useEffect
import {apiUrl, xAppSecret} from "@/api/api";
import { AuthManager } from "@/components/LoginScreen/LoginScreen";

interface DocumentCardProps {
    document: Document;
    getFileIcon: (item: CatalogItem) => JSX.Element;
    getFileSize: (fileSize: number) => string;
    onInfoPress: (document: Document) => void;
    onDownloadPress: () => void;
}

export function DocumentCard({ document, getFileIcon, getFileSize, onInfoPress, onDownloadPress }: DocumentCardProps) {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp', '.svg'];
    const isImage = imageExtensions.includes(document.content_type?.toLowerCase());
    const token = AuthManager.getToken();
    const imageUrl = `${apiUrl}/api/files/${encodeURIComponent(`${document.file_name}`)}`;
    const imageHeaders = {
        Authorization: `Bearer ${token}`,
        ...({ 'X-App-Secret': xAppSecret })
    };

    // Состояние для хранения локальной ссылки на картинку (только для веба)
    const [webPreviewUrl, setWebPreviewUrl] = useState<string | null>(null);

    useEffect(() => {
        // Если это веб и это изображение, загружаем его вручную с токеном
        if (Platform.OS === 'web' && isImage) {
            let isMounted = true;

            const fetchImageForWeb = async () => {
                try {
                    const response = await fetch(imageUrl, {
                        headers: imageHeaders
                    });
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

            // Очистка ссылки при размонтировании компонента для предотвращения утечек памяти
            return () => {
                isMounted = false;
                if (webPreviewUrl) {
                    URL.revokeObjectURL(webPreviewUrl);
                }
            };
        }
    }, [document.file_name, isImage]);

    // Определяем источник изображения в зависимости от платформы
    const imageSource = Platform.OS === 'web'
        ? { uri: webPreviewUrl || undefined } // В вебе используем blob-ссылку
        : {
            uri: imageUrl,
            headers: imageHeaders
        };

    return (
        <View style={styles.documentItem}>
            <TouchableOpacity onPress={onDownloadPress} style={styles.documentContent}>
                <View style={styles.documentIconContainer}>
                    {isImage ? (
                        <Image
                            source={imageSource}
                            style={{ width: "100%", height: "100%", borderRadius: 8 }}
                            resizeMode="cover"
                        />
                    ) : (
                        getFileIcon({
                            id: document.id,
                            name: document.content_type,
                            parent_catalog_id: null,
                            type: 'document'
                        } as CatalogItem)
                    )}
                </View>

                <View style={styles.documentInfo}>
                    <Text style={styles.documentName} numberOfLines={1}>
                        {document.file_name}{document.content_type}
                    </Text>
                    <View style={styles.documentMeta}>
                        <Text style={styles.documentMetaText}>
                            Размер: {getFileSize(document.file_size)}
                        </Text>
                    </View>
                </View>

                <TouchableOpacity
                    style={styles.documentActionButton}
                    onPress={() => onInfoPress(document)}
                >
                    <View pointerEvents="none">
                        <Info size={18} color="#777d87" />
                    </View>
                </TouchableOpacity>
            </TouchableOpacity>
        </View>
    );
}
