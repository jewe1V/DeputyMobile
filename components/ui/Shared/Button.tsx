import * as Icons from "lucide-react-native";
import { TouchableOpacity, View, StyleSheet } from "react-native";
import React from "react";

interface ButtonProps {
    onClick: () => void;
    iconName: keyof typeof Icons;
}

export const Button = ({ onClick, iconName }: ButtonProps) => {
    const IconComponent = Icons[iconName] as React.ComponentType<{ size: number; color: string }>;

    return (
        <TouchableOpacity style={styles.container} onPress={onClick}>
            <View pointerEvents="none">
                <IconComponent size={20} color="white" />
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    }
})
