import { db } from '@/firebase';
import { Feather } from '@expo/vector-icons';
import { getAuth } from 'firebase/auth';
import { collection, doc, getDocs, limit, orderBy, query, startAfter, updateDoc, where } from 'firebase/firestore';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Animated, FlatList, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import BoxOverview from './BoxOverview';

interface Flashcard {
    id: string;
    name: string;
    question: string;
    answer: string;
    caja?: number;
    folderId?: string;
    type: 'flashcard';
    updatedAt?: string;
}

interface Folder {
    id: string;
    name: string;
    parentId: string | null;
    type: 'folder';
}

const COLORS = {
    background: '#F8FAFC',
    primary: '#4C6FFF',
    primaryDark: '#3652CC',
    primaryLight: '#E6F0FF',
    text: '#1A2138',
    textSecondary: '#677489',
    accent: '#FF6060',
    border: '#E2E8F0',
    white: '#FFFFFF',
    folder: '#FFD700',
    flashcard: '#4682B4',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    cardShadow: 'rgba(0, 0, 0, 0.05)',
};

const BATCH_SIZE = 20;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos en milisegundos

interface CacheItem {
    data: (Folder | Flashcard)[];
    timestamp: number;
}

type BoxStats = Record<number, {
    total: number;
    lastUpdated: Date | null;
}>;

const FlashcardCaja = () => {
    const [items, setItems] = useState<(Folder | Flashcard)[]>([]);
    const [selectedFlashcard, setSelectedFlashcard] = useState<Flashcard | null>(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [viewFlashcardModalVisible, setViewFlashcardModalVisible] = useState(false);
    const [showAnswer, setShowAnswer] = useState(false);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [currentPath, setCurrentPath] = useState<Folder[]>([]);
    const [lastDoc, setLastDoc] = useState<any>(null);
    const [hasMore, setHasMore] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [cache, setCache] = useState<Record<string, CacheItem>>({});
    const [showBoxes, setShowBoxes] = useState(false);
    const [boxStats, setBoxStats] = useState<BoxStats>({
        1: { total: 0, lastUpdated: null },
        2: { total: 0, lastUpdated: null },
        3: { total: 0, lastUpdated: null },
        4: { total: 0, lastUpdated: null },
        5: { total: 0, lastUpdated: null }
    });
    const [selectedBox, setSelectedBox] = useState<number | null>(null);
    const [isFlipped, setIsFlipped] = useState(false);
    const flipAnimation = useRef(new Animated.Value(0)).current;
    const [currentFlashcardIndex, setCurrentFlashcardIndex] = useState<number>(-1);

    const currentFolderId = useMemo(() => 
        currentPath.length === 0 ? null : currentPath[currentPath.length - 1].id,
        [currentPath]
    );

    const cacheKey = useMemo(() => 
        `folder_${currentFolderId || 'root'}_${lastDoc?.id || 'initial'}`,
        [currentFolderId, lastDoc]
    );

    const updateBoxStats = useCallback((items: (Folder | Flashcard)[]) => {
        const stats: BoxStats = {
            1: { total: 0, lastUpdated: null },
            2: { total: 0, lastUpdated: null },
            3: { total: 0, lastUpdated: null },
            4: { total: 0, lastUpdated: null },
            5: { total: 0, lastUpdated: null }
        };

        items.forEach(item => {
            if (item.type === 'flashcard' && item.caja) {
                stats[item.caja].total++;
                
                // Solo actualizar lastUpdated si tenemos una fecha válida
                if (item.updatedAt) {
                    const newDate = new Date(item.updatedAt);
                    if (!isNaN(newDate.getTime())) { // Verificar si la fecha es válida
                        if (!stats[item.caja].lastUpdated || newDate > stats[item.caja].lastUpdated!) {
                            stats[item.caja].lastUpdated = newDate;
                        }
                    }
                }
            }
        });

        setBoxStats(stats);
    }, []);

    const fetchItems = useCallback(async (isRefreshing = false) => {
        try {
            const auth = getAuth();
            const currentUser = auth.currentUser;

            if (!currentUser) {
                console.log('No hay usuario autenticado');
                return;
            }

            // Verificar caché
            const cachedData = cache[cacheKey];
            const now = Date.now();
            if (cachedData && now - cachedData.timestamp < CACHE_DURATION && !isRefreshing) {
                setItems(prevItems => {
                    if (isRefreshing) return cachedData.data;
                    const existingIds = new Set(prevItems.map(item => item.id));
                    const uniqueNewItems = cachedData.data.filter(item => !existingIds.has(item.id));
                    return [...prevItems, ...uniqueNewItems];
                });
                setLoading(false);
                setLoadingMore(false);
                setRefreshing(false);
                return;
            }

            if (isRefreshing) {
                setLastDoc(null);
                setHasMore(true);
                setItems([]);
            }

            if (!hasMore && !isRefreshing) return;

            if (!isRefreshing) {
                setLoadingMore(true);
            }

            // Cargar carpetas y flashcards en paralelo
            const [foldersSnapshot, flashcardsSnapshot] = await Promise.all([
                getDocs(query(
                    collection(db, 'users', currentUser.uid, 'folders'),
                    where('parentId', '==', currentFolderId),
                    orderBy('position', 'asc'),
                    limit(BATCH_SIZE),
                    ...(lastDoc && !isRefreshing ? [startAfter(lastDoc)] : [])
                )),
                getDocs(query(
                    collection(db, 'users', currentUser.uid, 'flashcards'),
                    where('parentId', '==', currentFolderId),
                    orderBy('position', 'asc'),
                    limit(BATCH_SIZE),
                    ...(lastDoc && !isRefreshing ? [startAfter(lastDoc)] : [])
                ))
            ]);

            const lastVisible = foldersSnapshot.docs[foldersSnapshot.docs.length - 1];
            setLastDoc(lastVisible);
            setHasMore(foldersSnapshot.docs.length === BATCH_SIZE);

            const foldersData: Folder[] = foldersSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                type: 'folder'
            } as Folder));

            const flashcardsData: Flashcard[] = flashcardsSnapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    name: data.name || 'Sin nombre',
                    question: data.question || '',
                    answer: data.answer || '',
                    caja: data.caja,
                    folderId: data.folderId,
                    type: 'flashcard',
                    updatedAt: data.updatedAt
                } as Flashcard;
            });

            const newItems = isRefreshing 
                ? [...foldersData, ...flashcardsData]
                : [...items, ...foldersData, ...flashcardsData];

            // Actualizar caché
            setCache(prevCache => ({
                ...prevCache,
                [cacheKey]: {
                    data: newItems,
                    timestamp: now
                }
            }));

            setItems(newItems);
            updateBoxStats(newItems);
            setLastDoc(foldersSnapshot.docs[foldersSnapshot.docs.length - 1]);
            setHasMore(foldersSnapshot.docs.length > 0);
            setLoading(false);
            setLoadingMore(false);
            setRefreshing(false);
            
        } catch (error) {
            console.error('Error al obtener los datos:', error);
            setLoading(false);
            setLoadingMore(false);
            setRefreshing(false);
        }
    }, [currentPath, items, updateBoxStats]);

    const moveToCaja = useCallback(async (cajaNumber: number) => {
        if (!selectedFlashcard) return;

        try {
            const auth = getAuth();
            const currentUser = auth.currentUser;

            if (!currentUser) return;

            const flashcardRef = doc(db, 'users', currentUser.uid, 'flashcards', selectedFlashcard.id);
            await updateDoc(flashcardRef, {
                caja: cajaNumber
            });

            setItems(prevItems => {
                const newItems = prevItems.map(item => 
                    item.type === 'flashcard' && item.id === selectedFlashcard.id 
                        ? { ...item, caja: cajaNumber } 
                        : item
                );
                updateBoxStats(newItems);
                return newItems;
            });

            setModalVisible(false);
            setSelectedFlashcard(null);

        } catch (error) {
            console.error('Error al mover la flashcard:', error);
        }
    }, [selectedFlashcard, updateBoxStats]);

    const handleItemPress = useCallback((item: Folder | Flashcard) => {
        if (item.type === 'folder') {
            setCurrentPath([...currentPath, item]);
            setLastDoc(null);
            setHasMore(true);
            setItems([]);
        } else {
            const flashcardIndex = items.findIndex(i => i.type === 'flashcard' && i.id === item.id);
            setCurrentFlashcardIndex(flashcardIndex);
            setSelectedFlashcard(item);
            setShowAnswer(false);
            setIsFlipped(false);
            flipAnimation.setValue(0);
            setViewFlashcardModalVisible(true);
        }
    }, [currentPath, flipAnimation, items]);

    const handleNextFlashcard = useCallback(() => {
        if (currentFlashcardIndex < items.length - 1) {
            const nextItem = items[currentFlashcardIndex + 1];
            if (nextItem.type === 'flashcard') {
                setCurrentFlashcardIndex(currentFlashcardIndex + 1);
                setSelectedFlashcard(nextItem);
                setShowAnswer(false);
                setIsFlipped(false);
                flipAnimation.setValue(0);
            }
        }
    }, [currentFlashcardIndex, items, flipAnimation]);

    const handlePreviousFlashcard = useCallback(() => {
        if (currentFlashcardIndex > 0) {
            const prevItem = items[currentFlashcardIndex - 1];
            if (prevItem.type === 'flashcard') {
                setCurrentFlashcardIndex(currentFlashcardIndex - 1);
                setSelectedFlashcard(prevItem);
                setShowAnswer(false);
                setIsFlipped(false);
                flipAnimation.setValue(0);
            }
        }
    }, [currentFlashcardIndex, items, flipAnimation]);

    const hasNextFlashcard = useMemo(() => {
        if (currentFlashcardIndex === -1) return false;
        const nextItem = items[currentFlashcardIndex + 1];
        return nextItem && nextItem.type === 'flashcard';
    }, [currentFlashcardIndex, items]);

    const hasPreviousFlashcard = useMemo(() => {
        if (currentFlashcardIndex === -1) return false;
        const prevItem = items[currentFlashcardIndex - 1];
        return prevItem && prevItem.type === 'flashcard';
    }, [currentFlashcardIndex, items]);

    useEffect(() => {
        if (!viewFlashcardModalVisible) {
            setShowAnswer(false);
            setIsFlipped(false);
            flipAnimation.setValue(0);
        }
    }, [viewFlashcardModalVisible, flipAnimation]);

    const navigateBack = useCallback(() => {
        if (currentPath.length > 0) {
            setCurrentPath(currentPath.slice(0, -1));
            setLastDoc(null);
            setHasMore(true);
            setItems([]);
        }
    }, [currentPath]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchItems(true);
    }, [fetchItems]);

    const onEndReached = useCallback(() => {
        if (!loading && hasMore) {
            fetchItems();
        }
    }, [loading, hasMore, fetchItems]);

    useEffect(() => {
        fetchItems(true);
    }, [currentPath]);

    const handleBoxSelect = useCallback((boxNumber: number) => {
        setSelectedBox(prevBox => prevBox === boxNumber ? null : boxNumber);
    }, []);

    const filteredItems = useMemo(() => {
        if (selectedBox === null) return items;
        return items.filter(item => 
            item.type === 'flashcard' && item.caja === selectedBox
        );
    }, [items, selectedBox]);

    const renderItem = ({ item }: { item: Folder | Flashcard }) => (
        <TouchableOpacity 
            style={[
                styles.itemContainer,
                item.type === 'folder' ? styles.folderContainer : styles.flashcardContainer
            ]}
            onPress={() => handleItemPress(item)}
            activeOpacity={0.7}
        >
            <View style={styles.itemContent}>
                <View style={[
                    styles.iconContainer, 
                    item.type === 'folder' 
                        ? styles.folderIconContainer 
                        : styles.flashcardIconContainer
                ]}>
                    {item.type === 'folder' ? (
                        <Feather name="folder" size={24} color={COLORS.primary} />
                    ) : (
                        <Feather name="file-text" size={24} color={COLORS.primary} />
                    )}
                </View>
                <View style={styles.itemDetails}>
                    <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
                    {item.type === 'flashcard' && (
                        <>
                            <Text style={styles.itemSubtitle} numberOfLines={2}>
                                {item.question}
                            </Text>
                            {item.caja && (
                                <View style={[
                                    styles.cajaBadge,
                                    { backgroundColor: getCajaColor(item.caja) }
                                ]}>
                                    <Text style={styles.cajaBadgeText}>Caja {item.caja}</Text>
                                </View>
                            )}
                        </>
                    )}
                </View>
                <Feather 
                    name={item.type === 'folder' ? 'chevron-right' : 'more-vertical'} 
                    size={20} 
                    color={COLORS.textSecondary} 
                />
            </View>
        </TouchableOpacity>
    );

    const getCajaColor = (cajaNumber: number) => {
        const colors = [
            COLORS.primary,
            COLORS.success,
            COLORS.warning,
            COLORS.accent,
            COLORS.error
        ];
        return colors[cajaNumber - 1] || COLORS.primary;
    };

    const renderFooter = () => {
        if (!loadingMore) return null;
        return (
            <View style={styles.footerLoader}>
                <ActivityIndicator size="small" color={COLORS.primary} />
                <Text style={styles.loadingMoreText}>Cargando más elementos...</Text>
            </View>
        );
    };

    const flipCard = () => {
        Animated.spring(flipAnimation, {
            toValue: isFlipped ? 0 : 1,
            friction: 8,
            tension: 10,
            useNativeDriver: true,
        }).start();
        setIsFlipped(!isFlipped);
    };

    const frontAnimatedStyle = {
        transform: [{
            rotateY: flipAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: ['0deg', '180deg']
            })
        }]
    };

    const backAnimatedStyle = {
        transform: [{
            rotateY: flipAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: ['180deg', '360deg']
            })
        }]
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View style={styles.headerContent}>
                    {currentPath.length > 0 && (
                        <TouchableOpacity 
                            onPress={navigateBack} 
                            style={styles.backButton}
                        >
                            <Feather name="chevron-left" size={24} color={COLORS.primary} />
                        </TouchableOpacity>
                    )}
                    <Text style={styles.headerTitle}>
                        {currentPath.length > 0 
                            ? currentPath[currentPath.length - 1].name 
                            : 'Mis Flashcards'}
                    </Text>
                </View>
                <View style={styles.headerButtons}>
                    <TouchableOpacity 
                        style={styles.viewBoxesButton}
                        onPress={() => setShowBoxes(!showBoxes)}
                    >
                        <Feather name="box" size={20} color={COLORS.white} />
                        <Text style={styles.viewBoxesButtonText}>
                            {showBoxes ? 'Ocultar cajas' : 'Visualizar cajas'}
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                        style={styles.refreshButton}
                        onPress={onRefresh}
                    >
                        <Feather name="refresh-cw" size={20} color={COLORS.white} />
                    </TouchableOpacity>
                </View>
            </View>

            {showBoxes && (
                <BoxOverview
                    boxStats={boxStats}
                    selectedBox={selectedBox}
                    onSelectBox={handleBoxSelect}
                />
            )}

            {loading && items.length === 0 ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                    <Text style={styles.loadingText}>Cargando elementos...</Text>
                </View>
            ) : (
                <FlatList
                    data={filteredItems}
                    renderItem={renderItem}
                    keyExtractor={item => `${item.type}_${item.id}`}
                    contentContainerStyle={[
                        styles.listContainer,
                        items.length === 0 && styles.emptyListContainer
                    ]}
                    ListEmptyComponent={
                        !loading && !loadingMore ? (
                            <View style={styles.emptyContainer}>
                                <Feather name="inbox" size={48} color={COLORS.textSecondary} />
                                <Text style={styles.emptyText}>
                                    {currentPath.length === 0 
                                        ? 'No hay elementos en la raíz' 
                                        : 'Esta carpeta está vacía'}
                                </Text>
                            </View>
                        ) : null
                    }
                    onEndReached={onEndReached}
                    onEndReachedThreshold={0.5}
                    ListFooterComponent={renderFooter}
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                />
            )}

            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Asignar a caja:</Text>
                        <View style={styles.cajasGrid}>
                            {[1, 2, 3, 4, 5].map((cajaNumber) => (
                                <TouchableOpacity
                                    key={cajaNumber}
                                    style={[
                                        styles.cajaButton,
                                        { backgroundColor: getCajaColor(cajaNumber) },
                                        selectedFlashcard?.caja === cajaNumber && styles.cajaButtonSelected
                                    ]}
                                    onPress={() => moveToCaja(cajaNumber)}
                                >
                                    <Text style={styles.cajaButtonText}>Caja {cajaNumber}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                        <TouchableOpacity
                            style={styles.closeButton}
                            onPress={() => setModalVisible(false)}
                        >
                            <Text style={styles.closeButtonText}>Cancelar</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Modal para visualizar el contenido de la flashcard */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={viewFlashcardModalVisible}
                onRequestClose={() => setViewFlashcardModalVisible(false)}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>{selectedFlashcard?.name}</Text>
                        
                        <View style={styles.flashcardContainer}>
                            <TouchableOpacity 
                                style={styles.flashcardTouchable}
                                onPress={flipCard}
                                activeOpacity={0.9}
                            >
                                <Animated.View style={[styles.flashcard, frontAnimatedStyle]}>
                                    <View style={styles.flashcardContent}>
                                        <Text style={styles.flashcardLabel}>Pregunta:</Text>
                                        <ScrollView 
                                            style={styles.scrollView}
                                            contentContainerStyle={styles.scrollViewContent}
                                        >
                                            <Text style={styles.flashcardText}>{selectedFlashcard?.question}</Text>
                                        </ScrollView>
                                        <Text style={styles.flashcardHint}>Toca para ver la respuesta</Text>
                                    </View>
                                </Animated.View>
                                
                                <Animated.View style={[styles.flashcard, styles.flashcardBack, backAnimatedStyle]}>
                                    <View style={styles.flashcardContent}>
                                        <Text style={styles.flashcardLabel}>Respuesta:</Text>
                                        <ScrollView 
                                            style={styles.scrollView}
                                            contentContainerStyle={styles.scrollViewContent}
                                        >
                                            <Text style={styles.flashcardText}>{selectedFlashcard?.answer}</Text>
                                        </ScrollView>
                                        <Text style={styles.flashcardHint}>Toca para ver la pregunta</Text>
                                    </View>
                                </Animated.View>
                            </TouchableOpacity>
                        </View>

                        {/* Navigation buttons */}
                        <View style={styles.navigationButtons}>
                            <TouchableOpacity
                                style={[
                                    styles.navButton,
                                    !hasPreviousFlashcard && styles.navButtonDisabled
                                ]}
                                onPress={handlePreviousFlashcard}
                                disabled={!hasPreviousFlashcard}
                            >
                                <Feather name="chevron-left" size={24} color={hasPreviousFlashcard ? COLORS.primary : COLORS.textSecondary} />
                                <Text style={[
                                    styles.navButtonText,
                                    !hasPreviousFlashcard && styles.navButtonTextDisabled
                                ]}>
                                    Anterior
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[
                                    styles.navButton,
                                    !hasNextFlashcard && styles.navButtonDisabled
                                ]}
                                onPress={handleNextFlashcard}
                                disabled={!hasNextFlashcard}
                            >
                                <Text style={[
                                    styles.navButtonText,
                                    !hasNextFlashcard && styles.navButtonTextDisabled
                                ]}>
                                    Siguiente
                                </Text>
                                <Feather name="chevron-right" size={24} color={hasNextFlashcard ? COLORS.primary : COLORS.textSecondary} />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.cajaButton]}
                                onPress={() => {
                                    setViewFlashcardModalVisible(false);
                                    setModalVisible(true);
                                }}
                            >
                                <Text style={styles.buttonText}>Asignar a caja</Text>
                            </TouchableOpacity>
                            
                            <TouchableOpacity
                                style={[styles.modalButton, styles.closeButton]}
                                onPress={() => setViewFlashcardModalVisible(false)}
                            >
                                <Text style={styles.closeButtonText}>Cerrar</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        backgroundColor: COLORS.white,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
        elevation: 2,
        shadowColor: COLORS.cardShadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 1,
        shadowRadius: 4,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: COLORS.text,
        marginLeft: 8,
    },
    backButton: {
        padding: 8,
        borderRadius: 8,
        backgroundColor: COLORS.primaryLight,
    },
    refreshButton: {
        backgroundColor: COLORS.primary,
        padding: 10,
        borderRadius: 12,
        elevation: 2,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
    },
    listContainer: {
        padding: 12,
    },
    itemContainer: {
        borderRadius: 12,
        marginBottom: 8,
        elevation: 2,
        shadowColor: COLORS.cardShadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 1,
        shadowRadius: 4,
    },
    folderContainer: {
        backgroundColor: COLORS.white,
        borderLeftWidth: 4,
        borderLeftColor: COLORS.folder,
    },
    flashcardContainer: {
        marginVertical: 20,
        height: 300,
    },
    flashcardTouchable: {
        flex: 1,
        position: 'relative',
    },
    flashcard: {
        position: 'absolute',
        width: '100%',
        height: '100%',
        backgroundColor: COLORS.white,
        borderRadius: 16,
        padding: 20,
        shadowColor: COLORS.cardShadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 1,
        shadowRadius: 4,
        elevation: 3,
        backfaceVisibility: 'hidden',
    },
    flashcardBack: {
        backgroundColor: COLORS.primaryLight,
    },
    flashcardContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollView: {
        flex: 1,
        width: '100%',
    },
    scrollViewContent: {
        flexGrow: 1,
        justifyContent: 'center',
        paddingVertical: 10,
    },
    flashcardLabel: {
        fontSize: 18,
        fontWeight: '600',
        color: COLORS.text,
        marginBottom: 12,
    },
    flashcardText: {
        fontSize: 16,
        color: COLORS.textSecondary,
        lineHeight: 24,
        textAlign: 'center',
        paddingHorizontal: 10,
    },
    flashcardHint: {
        position: 'absolute',
        bottom: 10,
        fontSize: 12,
        color: COLORS.textSecondary,
        fontStyle: 'italic',
    },
    itemContent: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
    },
    iconContainer: {
        padding: 8,
        borderRadius: 8,
        marginRight: 8,
    },
    folderIconContainer: {
        backgroundColor: '#FFF8DC',
    },
    flashcardIconContainer: {
        backgroundColor: COLORS.primaryLight,
    },
    itemDetails: {
        flex: 1,
    },
    itemName: {
        fontSize: 15,
        fontWeight: '600',
        color: COLORS.text,
        marginBottom: 2,
    },
    itemSubtitle: {
        fontSize: 13,
        color: COLORS.textSecondary,
        lineHeight: 18,
    },
    cajaBadge: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 8,
        alignSelf: 'flex-start',
        marginTop: 4,
    },
    cajaBadgeText: {
        color: COLORS.white,
        fontSize: 12,
        fontWeight: '600',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 12,
        color: COLORS.textSecondary,
        fontSize: 16,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 40,
    },
    emptyText: {
        fontSize: 16,
        color: COLORS.textSecondary,
        marginTop: 12,
        textAlign: 'center',
    },
    emptyListContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    footerLoader: {
        paddingVertical: 20,
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'center',
    },
    loadingMoreText: {
        marginLeft: 10,
        color: COLORS.textSecondary,
        fontSize: 14,
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContent: {
        backgroundColor: COLORS.white,
        borderRadius: 20,
        padding: 24,
        width: '90%',
        elevation: 5,
        shadowColor: COLORS.cardShadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 1,
        shadowRadius: 8,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: COLORS.text,
        marginBottom: 20,
        textAlign: 'center',
    },
    cajasGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    cajaButton: {
        padding: 16,
        borderRadius: 12,
        width: '48%',
        marginBottom: 12,
        elevation: 2,
        shadowColor: COLORS.cardShadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 1,
        shadowRadius: 4,
    },
    cajaButtonSelected: {
        transform: [{ scale: 1.05 }],
    },
    cajaButtonText: {
        color: COLORS.white,
        textAlign: 'center',
        fontWeight: '600',
        fontSize: 16,
    },
    closeButton: {
        backgroundColor: COLORS.border,
        padding: 16,
        borderRadius: 12,
        marginTop: 8,
    },
    closeButtonText: {
        color: COLORS.text,
        textAlign: 'center',
        fontWeight: '600',
        fontSize: 16,
    },
    headerButtons: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    viewBoxesButton: {
        backgroundColor: COLORS.primary,
        padding: 10,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        elevation: 2,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
    },
    viewBoxesButtonText: {
        color: COLORS.white,
        fontSize: 14,
        fontWeight: '600',
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 12,
    },
    modalButton: {
        flex: 1,
        backgroundColor: COLORS.primary,
        padding: 16,
        borderRadius: 12,
    },
    buttonText: {
        color: COLORS.white,
        textAlign: 'center',
        fontWeight: '600',
        fontSize: 16,
    },
    navigationButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 16,
        marginBottom: 16,
    },
    navButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 8,
        backgroundColor: COLORS.primaryLight,
        minWidth: 120,
        justifyContent: 'center',
    },
    navButtonDisabled: {
        backgroundColor: COLORS.border,
        opacity: 0.7,
    },
    navButtonText: {
        color: COLORS.primary,
        fontSize: 16,
        fontWeight: '600',
        marginHorizontal: 8,
    },
    navButtonTextDisabled: {
        color: COLORS.textSecondary,
    },
});

export default FlashcardCaja;
