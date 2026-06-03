import React from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ActivityIndicator,
    Keyboard,
    TouchableWithoutFeedback,
} from 'react-native';
import { styles } from './file-manager-screen';
import { BottomSheetModal as ModalBottomSheet } from '@/components/ui/BottomSheetModal/BottomSheetModal';

interface CreateCatalogModalProps {
    visible: boolean;
    catalogName: string;
    creatingCatalog: boolean;
    createError: string | null;
    onClose: () => void;
    onNameChange: (name: string) => void;
    onCreate: () => void;
}

export function CreateCatalogModal({
                                       visible,
                                       catalogName,
                                       creatingCatalog,
                                       createError,
                                       onClose,
                                       onNameChange,
                                       onCreate
                                   }: CreateCatalogModalProps) {
    return (
        <ModalBottomSheet
            visible={visible}
            onClose={onClose}
            title="Создать каталог"
            heightFraction={0.38}
            scrollEnabled={false}
            keyboardAvoiding
            contentContainerStyle={localStyles.contentContainer}
            renderFooter={() => (
                <View style={styles.modalButtonsContainer}>
                    <TouchableOpacity
                        style={[styles.modalButton, styles.modalButtonCancel]}
                        onPress={onClose}
                        disabled={creatingCatalog}
                    >
                        <Text style={styles.modalButtonCancelText}>Отмена</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.modalButton, styles.modalButtonCreate]}
                        onPress={onCreate}
                        disabled={creatingCatalog}
                    >
                        {creatingCatalog ? (
                            <ActivityIndicator size="small" color="#ffffff" />
                        ) : (
                            <Text style={styles.modalButtonCreateText}>Создать</Text>
                        )}
                    </TouchableOpacity>
                </View>
            )}
        >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <View>
                    <TextInput
                        style={styles.modalInput}
                        placeholder="Название каталога"
                        value={catalogName}
                        onChangeText={onNameChange}
                        placeholderTextColor="#9ca3af"
                        editable={!creatingCatalog}
                        autoFocus={visible}
                        returnKeyType="done"
                        onSubmitEditing={onCreate}
                    />

                    {createError && (
                        <Text style={styles.modalError}>{createError}</Text>
                    )}
                </View>
            </TouchableWithoutFeedback>
        </ModalBottomSheet>
    );
}

const localStyles = {
    contentContainer: {
        paddingTop: 8,
    },
};