import { CatalogItem, Document } from '@/api/catalogService';
import { Download, Info } from 'lucide-react-native';
import { Text, TouchableOpacity, View } from 'react-native';
import { styles } from './file-manager-screen';

interface DocumentCardProps {
    document: Document;
    getFileIcon: (item: CatalogItem) => JSX.Element;
    getFileSize: (fileSize: number) => string;
    onInfoPress: (document: Document) => void;
}

export function DocumentCard({ document, getFileIcon, getFileSize, onInfoPress }: DocumentCardProps) {
    return (
        <View style={styles.documentItem}>
            <View style={styles.documentContent}>
                <View style={styles.documentIconContainer}>
                    {getFileIcon({ id: document.id, name: document.fileName, parentId: null, type: 'document' } as CatalogItem)}
                </View>
                <View style={styles.documentInfo}>
                    <Text style={styles.documentName} numberOfLines={1}>
                        {document.fileName}
                    </Text>
                    <View style={styles.documentMeta}>
                        <Text style={styles.documentMetaText}>
                            Размер: {getFileSize(document.fileSize)}
                        </Text>
                    </View>
                </View>
                <View style={styles.documentActions}>
                    <TouchableOpacity style={styles.documentActionButton}>
                        <Download size={17} color="#777d87" />
                    </TouchableOpacity>
                    <TouchableOpacity 
                        style={styles.documentActionButton}
                        onPress={() => onInfoPress(document)}
                    >
                        <Info size={18} color="#777d87" />
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
}
