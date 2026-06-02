import React, {useState, useRef, useEffect} from "react";
import {Text, TouchableOpacity, View, Pressable} from "react-native";
import {styles} from "@/components/TaskBoard/task-board-style";
import {ChevronDown} from "lucide-react-native";
import { useTheme } from "@/context/ThemeContext";


interface SelectProps {
    value?: string;
    onValueChange: (value: string) => void;
    items: Array<{ label: string; value: string }>;
    placeholder?: string;
}

export function Select({ value, onValueChange, items, placeholder }: SelectProps) {
    const { colors, isDark } = useTheme();
    const [isOpen, setIsOpen] = useState(false);
    const selectedItem = items.find(item => item.value === value);
    const triggerRef = useRef<View>(null);

    useEffect(() => {
        if (isOpen) {
            const handleOutsideClick = () => {
                setIsOpen(false);
            };

            // Добавляем слушатель на весь экран
            const timeoutId = setTimeout(() => {
                document.addEventListener('click', handleOutsideClick);
            }, 0);

            return () => {
                clearTimeout(timeoutId);
                document.removeEventListener('click', handleOutsideClick);
            };
        }
    }, [isOpen]);

    const handlePress = () => {
        setIsOpen(!isOpen);
    };

    const handleItemPress = (itemValue: string) => {
        onValueChange(itemValue);
        setIsOpen(false);
    };

    return (
        <View style={styles.selectContainer} ref={triggerRef}>
            <TouchableOpacity
                style={[styles.selectTrigger, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={handlePress}
            >
                <Text style={[styles.selectValue, { color: colors.text }]}>
                    {selectedItem?.label || placeholder || 'Выберите...'}
                </Text>
                <ChevronDown size={16} color={colors.subtext} />
            </TouchableOpacity>
            {isOpen && (
                <Pressable onPress={() => setIsOpen(false)}>
                    <View style={[styles.selectContent, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        {items.map((item) => (
                            <TouchableOpacity
                                key={item.value}
                                style={[styles.selectItem, { borderBottomColor: colors.divider }]}
                                onPress={() => handleItemPress(item.value)}
                            >
                                <Text style={[styles.selectItemText, { color: colors.text }]}>{item.label}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </Pressable>
            )}
        </View>
    );
}
