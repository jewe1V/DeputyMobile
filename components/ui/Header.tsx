import {Image, StyleSheet, Text, TouchableOpacity, View, Alert} from "react-native";
import React from "react";
import { Ionicons } from '@expo/vector-icons';
import {router} from "expo-router";

interface HeaderProps {
    title?: string;
    subTitle?: string;
    button?: [string, string];
}

export const Header: React.FC<HeaderProps> = ({
                                                  title = "Деятельность депутата",
                                                  subTitle = "Екатеринбургская городская Дума",
                                                  button = [],
                                              }) => {
    return (
        <>
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <Image
                        resizeMode="contain"
                        source={require('@/assets/images/ekb-emblem.png')}
                        style={styles.emblem}
                    />
                    <View>
                        <Text style={styles.hTitle}>{title}</Text>
                        <Text style={styles.hSub}>{subTitle}</Text>
                    </View>
                </View>

                {button.length !== 0 && (<TouchableOpacity
                    style={[
                        styles.headerDot
                    ]}
                    onPress={() => router.push(button[1])}
                >
                    <Ionicons
                        name={button[0]}
                        size={20}
                        color={"#6b7280"}
                    />
                </TouchableOpacity>)}
            </View>
        </>
    );
};

const styles = StyleSheet.create({
    header: {
        marginTop: 12,
        marginBottom: 4,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between'
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center'
    },
    emblem: {
        width: 52,
        height: 52,
        marginRight: 12
    },
    hTitle: {
        fontSize: 20,
        fontFamily: 'Inter_600SemiBold',
        color: '#000000'
    },
    hSub: {
        fontSize: 12,
        color: '#6b7280',
        fontFamily: 'Inter_400Regular'
    },
    headerDot: {
        padding: 7,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    authenticatedButton: {
        borderColor: '#f64252',
        backgroundColor: '#f0f7ff',
    },
});
