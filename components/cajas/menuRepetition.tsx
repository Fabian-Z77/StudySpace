import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Dimensions, Platform, StatusBar, StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';

const { width } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';

const COLORS = {
  background: '#e0e7ff', // degradado azul-lila
  primary: '#4C6FFF',
  secondary: '#34C759',
  tertiary: '#FF9500',
  text: '#1A2138',
  white: '#FFFFFF',
  glass: 'rgba(255,255,255,0.25)',
  border: 'rgba(255,255,255,0.18)',
};

const NAV_CARDS = [
  {
    key: 'space',
    title: 'Space Repetition',
    subtitle: 'Repaso inteligente',
    icon: 'home',
    color: COLORS.primary,
    route: '/Space',
    gradient: ['#4C6FFF', '#6EE7B7'],
  },
  {
    key: 'flashcard',
    title: 'Flashcard App',
    subtitle: 'Tus tarjetas de estudio',
    icon: 'book',
    color: COLORS.secondary,
    route: '/flashcardApp',
    gradient: ['#34C759', '#A7F3D0'],
  },
  {
    key: 'programming',
    title: 'Programming Error',
    subtitle: 'Soluciona tus bugs',
    icon: 'code',
    color: COLORS.tertiary,
    route: '/ProgrammingError',
    gradient: ['#FF9500', '#FDE68A'],
  },
];

const MenuRepetition = () => {
    const router = useRouter();

    return (
        <View style={styles.gradientBg}>
            <StatusBar barStyle="light-content" />
            <View style={styles.header}>
                <Text style={styles.title}>Sistema de Repaso</Text>
                <Text style={styles.subtitle}>Elige tu método de estudio</Text>
            </View>

            {/* Navegación visual glassmorphism solo para web */}
            {isWeb && (
                <View style={styles.webNavRow}>
                    {NAV_CARDS.map(card => (
                        <TouchableOpacity
                            key={card.key}
                            style={[styles.webNavCard, {
                                backgroundColor: COLORS.glass,
                                borderColor: card.color,
                                boxShadow: `0 8px 32px 0 ${card.color}33`,
                                backdropFilter: 'blur(12px)',
                            }]}
                            activeOpacity={0.85}
                            onPress={() => router.push(card.route)}
                        >
                            <View style={[styles.iconCircle, { backgroundColor: card.color+'22', borderColor: card.color }]}> 
                                <Feather name={card.icon} size={54} color={card.color} />
                            </View>
                            <Text style={styles.webNavCardTitle}>{card.title}</Text>
                            <Text style={styles.webNavCardSubtitle}>{card.subtitle}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            )}

            <View style={styles.content}>
                <View style={styles.cardsContainer}>
                    <TouchableOpacity 
                        style={[styles.card, styles.leitnerCard]}
                        activeOpacity={0.8}
                        onPress={() => router.push('/FlashcardCaja')}
                    >
                        <View style={styles.cardContent}>
                            <Feather name="box" size={isWeb ? 44 : 36} color={COLORS.white} />
                            <Text style={styles.cardTitle}>Leitner</Text>
                            <Text style={styles.cardSubtitle}>5 cajas de repaso</Text>
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity 
                        style={[styles.card, styles.fechasCard]}
                        activeOpacity={0.8}
                        onPress={() => router.push('/Space')}
                    >
                        <View style={styles.cardContent}>
                            <Feather name="calendar" size={isWeb ? 44 : 36} color={COLORS.white} />
                            <Text style={styles.cardTitle}>Fechas</Text>
                            <Text style={styles.cardSubtitle}>Repaso por intervalos</Text>
                        </View>
                    </TouchableOpacity>
                </View>
            </View>
        </View> 
    )   
}

const styles = StyleSheet.create({
    gradientBg: {
        flex: 1,
        minHeight: isWeb ? '100vh' : undefined,
        background: isWeb
            ? 'linear-gradient(135deg, #e0e7ff 0%, #f0fdfa 100%)'
            : undefined,
        backgroundColor: !isWeb ? COLORS.background : undefined,
    },
    header: {
        paddingTop: isWeb ? 60 : 60,
        paddingBottom: 40,
        paddingHorizontal: isWeb ? 40 : 20,
        backgroundColor: 'transparent',
        alignItems: 'center',
    } as ViewStyle,
    title: {
        fontSize: isWeb ? 38 : 28,
        fontWeight: 'bold',
        color: COLORS.primary,
        marginBottom: 10,
        letterSpacing: 1.2,
        textShadowColor: '#fff',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 2,
    },
    subtitle: {
        fontSize: isWeb ? 22 : 16,
        color: COLORS.text,
        opacity: 0.7,
        marginBottom: 10,
    },
    webNavRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 40,
        marginTop: 36,
        marginBottom: 36,
    },
    webNavCard: {
        width: 260,
        height: 180,
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        marginHorizontal: 8,
        marginBottom: 8,
        transition: 'transform 0.2s, box-shadow 0.2s',
        cursor: 'pointer',
    },
    iconCircle: {
        width: 72,
        height: 72,
        borderRadius: 36,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        marginBottom: 12,
    },
    webNavCardTitle: {
        color: COLORS.text,
        fontSize: 22,
        fontWeight: 'bold',
        marginTop: 2,
        textAlign: 'center',
        letterSpacing: 1,
    },
    webNavCardSubtitle: {
        color: COLORS.text,
        fontSize: 15,
        opacity: 0.7,
        marginTop: 4,
        textAlign: 'center',
    },
    content: {
        flex: 1,
        padding: isWeb ? 60 : 20,
        paddingTop: 40,
    } as ViewStyle,
    cardsContainer: {
        flexDirection: isWeb ? 'row' : 'column',
        justifyContent: 'center',
        alignItems: 'center',
        gap: isWeb ? 40 : 20,
        flexWrap: 'wrap',
        maxWidth: isWeb ? 1000 : undefined,
        marginHorizontal: 'auto',
    } as ViewStyle,
    card: {
        width: isWeb ? 450 : width - 40,
        height: isWeb ? 250 : 160,
        borderRadius: 28,
        overflow: 'hidden',
        elevation: 6,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 6,
        },
        shadowOpacity: 0.18,
        shadowRadius: 8.65,
        ...(isWeb && {
            cursor: 'pointer',
            transition: 'all 0.3s cubic-bezier(.4,2,.6,1)',
            ':hover': {
                transform: 'scale(1.04)',
                boxShadow: '0 8px 32px 0 #4C6FFF33',
            },
        }),
    } as ViewStyle,
    leitnerCard: {
        backgroundColor: COLORS.primary,
    } as ViewStyle,
    fechasCard: {
        backgroundColor: COLORS.secondary,
    } as ViewStyle,
    cardContent: {
        flex: 1,
        padding: isWeb ? 40 : 20,
        justifyContent: 'center',
        alignItems: 'center',
    } as ViewStyle,
    cardTitle: {
        fontSize: isWeb ? 32 : 24,
        fontWeight: 'bold',
        color: COLORS.white,
        marginTop: 16,
        marginBottom: 8,
        letterSpacing: 1,
    },
    cardSubtitle: {
        fontSize: isWeb ? 20 : 16,
        color: 'rgba(255, 255, 255, 0.8)',
    },
});

export default MenuRepetition;