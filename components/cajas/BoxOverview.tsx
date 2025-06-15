import { Feather } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const COLORS = {
    primary: '#4C6FFF',
    success: '#10B981',
    warning: '#F59E0B',
    accent: '#EF4444',
    error: '#EF4444',
    box1: '#4C6FFF',
    box2: '#10B981',
    box3: '#F59E0B',
    box4: '#EF4444',
    box5: '#8B5CF6',
    white: '#FFFFFF',
    text: '#1A2138',
    textSecondary: '#677489',
    border: '#E2E8F0',
};

const BOX_INFO = {
    1: { name: 'Nueva', color: COLORS.box1 },
    2: { name: 'En proceso', color: COLORS.box2 },
    3: { name: 'Repaso', color: COLORS.box3 },
    4: { name: 'Difícil', color: COLORS.box4 },
    5: { name: 'Dominada', color: COLORS.box5 },
};

export interface BoxStats {
    total: number;
    lastUpdated: Date | null;
}

interface BoxOverviewProps {
    boxStats: Record<number, BoxStats>;
    selectedBox?: number | null;
    onSelectBox?: (boxNumber: number) => void;
}

const BoxOverview: React.FC<BoxOverviewProps> = ({ boxStats, selectedBox, onSelectBox }) => {
    return (
        <View style={styles.boxOverview}>
            {Object.entries(BOX_INFO).map(([boxNumber, info]) => {
                const stats = boxStats[Number(boxNumber)];
                return (
                    <TouchableOpacity
                        key={boxNumber}
                        style={[
                            styles.boxCard,
                            { backgroundColor: info.color, borderColor: selectedBox === Number(boxNumber) ? COLORS.primary : 'transparent' },
                        ]}
                        onPress={() => onSelectBox && onSelectBox(Number(boxNumber))}
                        activeOpacity={0.8}
                    >
                        <View style={styles.boxHeader}>
                            <Feather name="archive" size={22} color={COLORS.white} />
                            <Text style={styles.boxName}>{info.name}</Text>
                        </View>
                        <Text style={styles.boxCount}>{stats?.total ?? 0} flashcards</Text>
                        {stats?.lastUpdated && (
                            <Text style={styles.boxDate}>
                                Última actualización: {stats.lastUpdated.toLocaleDateString()}
                            </Text>
                        )}
                    </TouchableOpacity>
                );
            })}
        </View>
    );
};

const styles = StyleSheet.create({
    boxOverview: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        padding: 8,
        backgroundColor: COLORS.white,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
        justifyContent: 'space-between',
    },
    boxCard: {
        width: '48%',
        marginBottom: 12,
        padding: 16,
        borderRadius: 12,
        borderWidth: 2,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    boxHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    boxName: {
        color: COLORS.white,
        fontWeight: 'bold',
        fontSize: 16,
        marginLeft: 8,
    },
    boxCount: {
        color: COLORS.white,
        fontSize: 14,
        marginBottom: 4,
    },
    boxDate: {
        color: COLORS.white,
        fontSize: 12,
        opacity: 0.8,
    },
});

export default BoxOverview; 