import React, { useState, useRef } from 'react';
import {
    View,
    TextInput,
    TouchableOpacity,
    ActivityIndicator,
    Keyboard,
    Platform,
    TextInput as RNTextInput,
} from 'react-native';
import { Send } from 'lucide-react-native';

interface CommentInputProps {
    onSend: (text: string) => Promise<void>;
    isLoading?: boolean;
}

export const CommentInput: React.FC<CommentInputProps> = ({ onSend, isLoading = false }) => {
    const [text, setText] = useState('');
    const [inputHeight, setInputHeight] = useState(40);
    const inputRef = useRef<RNTextInput>(null);

    const handleSend = async () => {
        if (!text.trim() || isLoading) return;

        await onSend(text.trim());
        setText('');
        setInputHeight(40); // Сбрасываем высоту после отправки
        Keyboard.dismiss();
    };

    const handleContentSizeChange = (event: any) => {
        const newHeight = event.nativeEvent.contentSize.height;
        // Ограничиваем максимальную высоту 150
        if (newHeight <= 150 && newHeight !== inputHeight) {
            setInputHeight(newHeight);
        } else if (newHeight > 150 && inputHeight !== 150) {
            setInputHeight(150);
        }
    };

    return (
        <View style={styles.commentInputContainer}>
            <View style={styles.commentInputWrapper}>
                <TextInput
                    ref={inputRef}
                    style={[
                        styles.commentInput,
                        { height: Math.max(40, Math.min(150, inputHeight)) }
                    ]}
                    placeholder="Напишите комментарий..."
                    placeholderTextColor="#94a3b8"
                    value={text}
                    onChangeText={setText}
                    multiline
                    maxLength={1000}
                    editable={!isLoading}
                    onContentSizeChange={handleContentSizeChange}
                    selectionColor="#2A6E3F"
                    underlineColorAndroid="transparent"
                    {...(Platform.OS === 'web' && {
                        onFocus: (e) => {
                            e.currentTarget.style.outline = 'none';
                        },
                        onBlur: (e) => {
                            e.currentTarget.style.outline = 'none';
                        },
                    })}
                />
                <TouchableOpacity
                    style={styles.commentSendBtn}
                    onPress={handleSend}
                    disabled={!text.trim() || isLoading}
                >
                    {isLoading ? (
                        <ActivityIndicator size="small" color={"#2e753c"} />
                    ) : (
                        <Send size={18} color={(!text.trim() || isLoading) ?"#94a3b8" : "#2e753c"} />
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = {
    commentInputContainer: {
        margin: 20,
        marginTop: 0,
    },
    commentInputWrapper: {
        flexDirection: 'row' as const,
        alignItems: 'flex-end',
        backgroundColor: '#f8fafc',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        padding: 8,
        paddingLeft: 16,
    },
    commentInput: {
        flex: 1,
        fontSize: 14,
        color: '#1e293b',
        paddingVertical: 10,
        maxHeight: 150,
        minHeight: 40,
        padding: 0,
        margin: 0,
        textAlignVertical: 'top',
        // Для Web
        ...Platform.select({
            web: {
                outline: 'none',
                outlineWidth: 0,
                outlineStyle: 'none',
                outlineColor: 'transparent',
                resize: 'vertical',
            },
            default: {},
        }),
    },
    commentSendBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 8,
        marginBottom: "auto",
    },
};
