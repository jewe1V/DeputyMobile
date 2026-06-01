import React, {useState, useRef, useEffect} from "react";
import {Text, TouchableOpacity, View, Pressable} from "react-native";
import {styles} from "@/components/TaskBoard/task-board-style";
import {ChevronDown} from "lucide-react-native";


interface SelectProps {
    value?: string;
    onValueChange: (value: string) => void;
    items: Array<{ label: string; value: string }>;
    placeholder?: string;
}

export function Select({ value, onValueChange, items, placeholder }: SelectProps) {
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
                style={styles.selectTrigger}
                onPress={handlePress}
            >
                <Text style={styles.selectValue}>
                    {selectedItem?.label || placeholder || 'Выберите...'}
                </Text>
                <ChevronDown size={16} color="#6B7280" />
            </TouchableOpacity>
            {isOpen && (
                <Pressable onPress={() => setIsOpen(false)}>
                    <View style={[styles.selectContent]}>
                        {items.map((item) => (
                            <TouchableOpacity
                                key={item.value}
                                style={styles.selectItem}
                                onPress={() => handleItemPress(item.value)}
                            >
                                <Text style={styles.selectItemText}>{item.label}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </Pressable>
            )}
        </View>
    );
}