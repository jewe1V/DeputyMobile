import { CatalogItem } from '@/api/catalogService';
import { ChevronRight, Folder } from 'lucide-react-native';
import { Text, TouchableOpacity, View } from 'react-native';
import { styles } from './file-manager-screen';

interface CatalogCardProps {
    catalog: CatalogItem;
    onPress: (catalog: CatalogItem) => void;
}

export function CatalogCard({ catalog, onPress }: CatalogCardProps) {
    return (
        <TouchableOpacity
            style={styles.catalogItem}
            onPress={() => onPress(catalog)}
        >
            <View style={styles.catalogContent}>
                <View style={styles.catalogIconContainer}>
                    <Folder size={24} color="#2A6E3F" />
                </View>
                <View style={styles.catalogInfo}>
                    <Text style={styles.catalogName} numberOfLines={1}>
                        {catalog.name}
                    </Text>
                    <Text style={styles.catalogCount}>Каталог</Text>
                </View>
                <ChevronRight size={20} color="#9ca3af" />
            </View>
        </TouchableOpacity>
    );
}
