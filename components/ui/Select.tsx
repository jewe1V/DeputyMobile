import React, {useState} from "react";
import {Text, TouchableOpacity, View} from "react-native";
import {styles} from "@/components/TaskBoard/task-board-style";
import {ChevronDown} from "lucide-react-native";


interface SelectProps {
    value: string;
    onValueChange: (value: string) => void;
    items: Array<{ label: string; value: string }>;
    placeholder?: string;
}

export function Select({ value, onValueChange, items, placeholder }: SelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const selectedItem = items.find(item => item.value === value);

    return (
        <View style={styles.selectContainer}>
            <TouchableOpacity
                style={styles.selectTrigger}
                onPress={() => setIsOpen(!isOpen)}
            >
                <Text style={styles.selectValue}>
                    {selectedItem?.label || placeholder || 'Выберите...'}
                </Text>
                <ChevronDown size={16} color="#6B7280" />
            </TouchableOpacity>
            {isOpen && (
                <View style={[styles.selectContent]}>
                    {items.map((item) => (
                        <TouchableOpacity
                            key={item.value}
                            style={styles.selectItem}
                            onPress={() => {
                                onValueChange(item.value);
                                setIsOpen(false);
                            }}
                        >
                            <Text style={styles.selectItemText}>{item.label}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            )}
        </View>
    );
}
