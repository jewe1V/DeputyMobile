import { CatalogItem } from '@/api/catalogService';
import { ChevronRight, Folder } from 'lucide-react-native';
import { Text, TouchableOpacity, View } from 'react-native';
import { styles } from './file-manager-screen';
import { useTheme } from '@/context/ThemeContext';

interface CatalogCardProps {
    catalog: CatalogItem;
    onPress: (catalog: CatalogItem) => void;
}

export function CatalogCard({ catalog, onPress }: CatalogCardProps) {
    const { colors, isDark } = useTheme();
    return (
        <TouchableOpacity
            style={[styles.catalogItem, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => onPress(catalog)}
        >
            <View style={styles.catalogContent}>
                <View style={[styles.catalogIconContainer, { backgroundColor: isDark ? colors.primary + '20' : '#f0fdf4' }]}>
                    <Folder size={24} color={isDark ? colors.roleText : "#2A6E3F"} />
                </View>
                <View style={styles.catalogInfo}>
                    <Text style={[styles.catalogName, { color: colors.text }]} numberOfLines={1}>
                        {catalog.name}
                    </Text>
                    <Text style={[styles.catalogCount, { color: colors.subtext }]}>Каталог</Text>
                </View>
                <ChevronRight size={20} color={colors.subtext} />
            </View>
        </TouchableOpacity>
    );
}
