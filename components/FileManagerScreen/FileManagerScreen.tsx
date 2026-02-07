import { CatalogItem } from '@/api/catalogService';
import { Document } from '@/api/documentService';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import { LinearGradient } from "expo-linear-gradient";
import {
    AlertCircle,
    Folder,
    FolderPlus,
    Home,
    Search,
    Upload
} from 'lucide-react-native';
import {
    ActivityIndicator,
    Modal,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CatalogCard } from './CatalogCard';
import { DocumentCard } from './DocumentCard';
import { DocumentDetailModal } from './DocumentDetailModal';
import { useFileManagerPresenter } from './FileManagerPresenter';
import { styles } from './file-manager-screen';

export function FileManager() {
    const { state, handlers, computed } = useFileManagerPresenter();
    const insets = useSafeAreaInsets();

    return (
        <View style={styles.container}>
            {/* Header */}
            <LinearGradient
                colors={['#2A6E3F', '#349339']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.header, {paddingTop: insets.top + 5}]}>

                <View style={styles.headerContent}>
                    <Text style={styles.headerTitle}>Документы</Text>
                    <Text style={styles.headerSubtitle}>
                        {state.currentCatalog ? state.currentCatalogLabel : 'Выберите каталог'}
                    </Text>
                </View>
                <View style={styles.headerButtonsContainer}>
                    <TouchableOpacity
                            style={styles.headerButton}
                            onPress={handlers.handleOpenCreateModal}
                        >
                            <FolderPlus size={24} color="#ffffff" />
                        </TouchableOpacity>
                    {state.currentCatalog && !state.currentCatalog.id.startsWith('root-') && (
                        <TouchableOpacity
                            style={styles.headerButton}
                            onPress={handlers.handleUploadFile}
                        >
                            <Upload size={20} color="#ffffff" />
                        </TouchableOpacity>
                    )}
                </View>
            </LinearGradient>

            {/* Breadcrumb */}
            {state.currentCatalog && (
                <View style={styles.breadcrumb}>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        style={styles.breadcrumbScroll}
                    >
                        <TouchableOpacity
                            style={styles.breadcrumbButton}
                            onPress={() => handlers.handleBreadcrumbClick(-1)}
                        >
                            <Home size={20} color="#2A6E3F" />
                        </TouchableOpacity>

                        {state.breadcrumbPath.map((item, index) => (
                            <View key={item.id} style={styles.breadcrumbItemContainer}>
                                <Text style={styles.breadcrumbSeparator}> / </Text>
                                {index === state.breadcrumbPath.length - 1 ? (
                                    <View style={styles.breadcrumbButtonCurrent}>
                                        <Text style={styles.breadcrumbTextCurrent}>{item.name}</Text>
                                    </View>
                                ) : (
                                    <TouchableOpacity
                                        style={styles.breadcrumbButton}
                                        onPress={() => handlers.handleBreadcrumbClick(index)}
                                    >
                                        <Text style={styles.breadcrumbText}>{item.name}</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        ))}
                    </ScrollView>
                </View>
            )}

            {/* Search
            {state.currentCatalog && (
                <View style={styles.searchContainer}>
                    <View style={styles.searchInputContainer}>
                        <Search size={16} color="#9ca3af" style={styles.searchIcon} />
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Поиск файлов..."
                            value={state.searchQuery}
                            onChangeText={handlers.handleSearchChange}
                            placeholderTextColor="#9ca3af"
                        />
                    </View>
                </View>
            )}*/}

            {/* Content */}
            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {state.loading && (
                    <SkeletonLoader count={3} itemHeight={80} itemMargin={12} />
                )}

                {state.error && (
                    <View style={styles.errorContainer}>
                        <AlertCircle size={32} color="#ef4444" />
                        <Text style={styles.errorText}>{state.error}</Text>
                        {state.currentCatalog === null && (
                            <TouchableOpacity
                                style={styles.errorButton}
                                onPress={() => handlers.handleGoBack()}
                            >
                                <Text style={styles.errorButtonText}>Попробовать снова</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                )}

                {/* Root Catalogs or Content */}
                {!state.currentCatalog && !state.loading && !state.error && (
                    <View style={styles.section}>
                        <View style={styles.catalogList}>
                            <CatalogCard
                                catalog={{ id: 'root-public', name: 'Общий', parentId: null, type: 'catalog' }}
                                onPress={() => handlers.handleOpenCatalog('public', 'Общий')}
                            />
                            <CatalogCard
                                catalog={{ id: 'root-mine', name: 'Личный', parentId: null, type: 'catalog' }}
                                onPress={() => handlers.handleOpenCatalog('mine', 'Личный')}
                            />
                            <CatalogCard
                                catalog={{ id: 'root-deputy', name: 'Каталог депутата', parentId: null, type: 'catalog' }}
                                onPress={() => handlers.handleOpenCatalog('deputy', 'Каталог депутата')}
                            />
                        </View>
                    </View>
                )}

                {/* Catalogs List */}
                {state.currentCatalog && !state.loading && computed.filteredCatalogs.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Каталоги ({computed.filteredCatalogs.length})</Text>
                        <View style={styles.catalogList}>
                            {computed.filteredCatalogs.map((cat: CatalogItem) => (
                                <CatalogCard
                                    key={cat.id}
                                    catalog={cat}
                                    onPress={handlers.handleOpenChildCatalog}
                                />
                            ))}
                        </View>
                    </View>
                )}

                {/* Documents List */}
                {state.currentCatalog && !state.loading && computed.filteredDocuments.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Файлы ({computed.filteredDocuments.length})</Text>
                        <View style={styles.documentList}>
                            {computed.filteredDocuments.map((doc: Document) => (
                                <DocumentCard
                                    key={doc.id}
                                    document={doc}
                                    getFileIcon={handlers.getFileIcon}
                                    getFileSize={handlers.getFileSize}
                                    onInfoPress={handlers.handleOpenDocumentDetail}
                                />
                            ))}
                        </View>
                    </View>
                )}

                {/* Empty State */}
                {state.currentCatalog && !state.loading && computed.filteredCatalogs.length === 0 && computed.filteredDocuments.length === 0 && !state.searchQuery && (
                    <View style={styles.emptyState}>
                        <View style={styles.emptyStateIcon}>
                            <Folder size={32} color="#9ca3af" />
                        </View>
                        <Text style={styles.emptyStateTitle}>Каталог пуст</Text>
                    </View>
                )}

                {/* No Results State */}
                {state.currentCatalog && !state.loading && computed.filteredCatalogs.length === 0 && computed.filteredDocuments.length === 0 && state.searchQuery && (
                    <View style={styles.emptyState}>
                        <View style={styles.emptyStateIcon}>
                            <Search size={32} color="#9ca3af" />
                        </View>
                        <Text style={styles.emptyStateTitle}>Ничего не найдено</Text>
                        <Text style={styles.emptyStateSubtitle}>Попробуйте изменить запрос поиска</Text>
                    </View>
                )}
            </ScrollView>

            {/* Create Catalog Modal */}
            <Modal
                visible={state.showCreateModal}
                transparent
                animationType="fade"
                onRequestClose={handlers.handleCloseCreateModal}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Создать каталог</Text>

                        <TextInput
                            style={styles.modalInput}
                            placeholder="Название каталога"
                            value={state.catalogName}
                            onChangeText={handlers.handleCatalogNameChange}
                            placeholderTextColor="#9ca3af"
                            editable={!state.creatingCatalog}
                        />

                        {state.createError && (
                            <Text style={styles.modalError}>{state.createError}</Text>
                        )}

                        <View style={styles.modalButtonsContainer}>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.modalButtonCancel]}
                                onPress={handlers.handleCloseCreateModal}
                                disabled={state.creatingCatalog}
                            >
                                <Text style={styles.modalButtonCancelText}>Отмена</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.modalButton, styles.modalButtonCreate]}
                                onPress={handlers.handleCreateCatalog}
                                disabled={state.creatingCatalog}
                            >
                                {state.creatingCatalog ? (
                                    <ActivityIndicator size="small" color="#ffffff" />
                                ) : (
                                    <Text style={styles.modalButtonCreateText}>Создать</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Document Detail Modal */}
            <DocumentDetailModal
                visible={state.showDocumentDetailModal}
                document={state.selectedDocument}
                onClose={handlers.handleCloseDocumentDetail}
                onDelete={handlers.handleDeleteDocument}
            />
        </View>
    );
}
