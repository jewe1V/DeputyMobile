import React, { useState } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    TextInput,
    StyleSheet,
    SafeAreaView,
    Dimensions,
    Pressable,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import {
    Folder,
    FileText,
    Download,
    Upload,
    FolderPlus,
    ArrowLeft,
    File,
    FileSpreadsheet,
    ChevronRight,
    Search,
    MoreVertical, Plus,
} from 'lucide-react-native';
import { mockCatalogs } from '@/data/mockData';
import { Catalog } from '@/data/types';
import { styles } from './file-manager-screen';
import {LinearGradient} from "expo-linear-gradient";

export function FileManager() {
    const navigation = useNavigation();
    const [currentCatalog, setCurrentCatalog] = useState<Catalog | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        });
    };

    const getFileIcon = (fileName: string, size = 20) => {
        const ext = fileName.split('.').pop()?.toLowerCase();

        switch (ext) {
            case 'pdf':
                return <FileText size={size} color="#ef4444" />;
            case 'doc':
            case 'docx':
                return <FileText size={size} color="#3b82f6" />;
            case 'xls':
            case 'xlsx':
                return <FileSpreadsheet size={size} color="#16a34a" />;
            default:
                return <File size={size} color="#6b7280" />;
        }
    };

    const getFileSize = (fileName: string): string => {
        const sizes = ['245 КБ', '1.2 МБ', '524 КБ', '3.5 МБ', '892 КБ'];
        return sizes[Math.floor(Math.random() * sizes.length)];
    };

    const displayCatalogs = currentCatalog ? currentCatalog.children || [] : mockCatalogs;
    const displayDocuments = currentCatalog ? currentCatalog.documents || [] : [];

    const filteredCatalogs = displayCatalogs.filter(catalog =>
        catalog.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    const filteredDocuments = displayDocuments.filter(doc =>
        doc.fileName.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <View style={styles.container}>
            {/* Header */}
            <LinearGradient
                colors={['#2A6E3F', '#349339']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.header}
            >
                <View style={styles.headerContent}>
                    <Text style={styles.headerTitle}>Документы</Text>
                    <Text style={styles.headerSubtitle}>{currentCatalog ? currentCatalog.name : 'Все каталоги'}</Text>
                </View>
                <View style={styles.headerButtonsContainer}>
                    {!currentCatalog && (
                        <TouchableOpacity style={styles.headerButton}>
                            <FolderPlus size={24} color="#ffffff" />
                        </TouchableOpacity>
                    )}
                    <TouchableOpacity style={styles.headerButton}>
                        <Upload size={20} color="#ffffff" />
                    </TouchableOpacity>
                </View>
            </LinearGradient>

            {/* Breadcrumb */}
            {currentCatalog && (
                <View style={styles.breadcrumb}>
                    <TouchableOpacity
                        style={styles.breadcrumbButton}
                        onPress={() => setCurrentCatalog(null)}
                    >
                        <Folder size={16} color="#2A6E3F" />
                        <Text style={styles.breadcrumbText}>Все каталоги</Text>
                        <ChevronRight size={16} color="#2A6E3F" />
                        <Text style={styles.breadcrumbCurrent}>{currentCatalog.name}</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* Search */}
            <View style={styles.searchContainer}>
                <View style={styles.searchInputContainer}>
                    <Search size={16} color="#9ca3af" style={styles.searchIcon} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Поиск файлов и каталогов..."
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        placeholderTextColor="#9ca3af"
                    />
                </View>
            </View>

            {/* Content */}
            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Каталоги */}
                {filteredCatalogs.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Каталоги</Text>
                        <View style={styles.catalogList}>
                            {filteredCatalogs.map((catalog) => (
                                <TouchableOpacity
                                    key={catalog.id}
                                    style={styles.catalogItem}
                                    onPress={() => setCurrentCatalog(catalog)}
                                >
                                    <View style={styles.catalogContent}>
                                        <View style={styles.catalogIconContainer}>
                                            <Folder size={24} color="#2A6E3F" />
                                        </View>
                                        <View style={styles.catalogInfo}>
                                            <Text style={styles.catalogName} numberOfLines={1}>
                                                {catalog.name}
                                            </Text>
                                            <Text style={styles.catalogCount}>
                                                {catalog.documents?.length || 0}{' '}
                                                {catalog.documents?.length === 1 ? 'файл' : 'файлов'}
                                            </Text>
                                        </View>
                                        <ChevronRight size={20} color="#9ca3af" />
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                )}

                {/* Документы */}
                {filteredDocuments.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Файлы</Text>
                        <View style={styles.documentList}>
                            {filteredDocuments.map((doc) => (
                                <View key={doc.id} style={styles.documentItem}>
                                    <View style={styles.documentContent}>
                                        <View style={styles.documentIconContainer}>
                                            {getFileIcon(doc.fileName)}
                                        </View>
                                        <View style={styles.documentInfo}>
                                            <Text style={styles.documentName} numberOfLines={1}>
                                                {doc.fileName}
                                            </Text>
                                            <View style={styles.documentMeta}>
                                                <Text style={styles.documentMetaText}>
                                                    {doc.uploadedBy.split(' ').slice(0, 2).join(' ')}
                                                </Text>
                                                <Text style={styles.documentMetaDot}>•</Text>
                                                <Text style={styles.documentMetaText}>
                                                    {formatDate(doc.uploadedAt)}
                                                </Text>
                                                <Text style={styles.documentMetaDot}>•</Text>
                                                <Text style={styles.documentMetaText}>
                                                    {getFileSize(doc.fileName)}
                                                </Text>
                                            </View>
                                        </View>
                                        <View style={styles.documentActions}>
                                            <TouchableOpacity style={styles.documentActionButton}>
                                                <Download size={16} color="#2A6E3F" />
                                            </TouchableOpacity>
                                            <TouchableOpacity style={styles.documentActionButton}>
                                                <MoreVertical size={16} color="#9ca3af" />
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                </View>
                            ))}
                        </View>
                    </View>
                )}

                {/* Empty State */}
                {filteredCatalogs.length === 0 && filteredDocuments.length === 0 && (
                    <View style={styles.emptyState}>
                        <View style={styles.emptyStateIcon}>
                            {searchQuery ? (
                                <Search size={32} color="#9ca3af" />
                            ) : (
                                <Folder size={32} color="#9ca3af" />
                            )}
                        </View>
                        <Text style={styles.emptyStateTitle}>
                            {searchQuery ? 'Ничего не найдено' : 'Каталог пуст'}
                        </Text>
                        <Text style={styles.emptyStateSubtitle}>
                            {searchQuery ? 'Попробуйте изменить запрос' : 'Загрузите первый документ'}
                        </Text>
                    </View>
                )}
            </ScrollView>
        </View>
    );
}
