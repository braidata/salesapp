//hack to the sap db
//create a fake hacker code to grant access to the sap db

import React from 'react';
import { View, Text, StyleSheet, Button } from 'react-native';

const Fantasma = ({ navigation }) => {
    return (
        <View style={styles.container}>
        <Text style={styles.text}>Fantasma</Text>
        <Button
            title="Go to Home"
            onPress={() => navigation.navigate('Home')}
        />
        </View>
    );
    };

    const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },

    text: {
        fontSize: 30,
    },
    });

    export default Fantasma;

// Path: lib/ghost.tsx