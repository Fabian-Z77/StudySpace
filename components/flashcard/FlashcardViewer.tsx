import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Animated, 
  TouchableOpacity, 
  Dimensions,
  ScrollView,
  Modal,
  SafeAreaView,
  Pressable
} from 'react-native';
import { Feather } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

const FlashcardViewer = ({ 
  flashcard, 
  isVisible, 
  onClose, 
  onEdit,
  onNext,
  onPrevious,
  hasNext = false,
  hasPrevious = false,
  onMarkReviewed = null
}) => {
  const [showAnswer, setShowAnswer] = useState(false);
  const [isReviewed, setIsReviewed] = useState(false);
  const flipAnimation = useRef(new Animated.Value(0)).current;
  
  
  // Reset states when flashcard changes
  useEffect(() => {
    setShowAnswer(false);
    setIsReviewed(false);
  }, [flashcard]);

  // Flip card animation
  const flipCard = () => {
    if (showAnswer) {
      Animated.timing(flipAnimation, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => setShowAnswer(false));
    } else {
      Animated.timing(flipAnimation, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start(() => setShowAnswer(true));
    }
  };

  // Calculate the rotation based on flipAnimation
  const frontInterpolate = flipAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  const backInterpolate = flipAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ['180deg', '360deg'],
  });

  const frontAnimatedStyle = {
    transform: [{ rotateY: frontInterpolate }],
  };

  const backAnimatedStyle = {
    transform: [{ rotateY: backInterpolate }],
  };

  // Mark the flashcard as reviewed
  const handleMarkReviewed = () => {
    setIsReviewed(true);
    if (onMarkReviewed) {
      onMarkReviewed(flashcard);
    }
  };

  console.log("flashcard content: ", flashcard)

  if (!flashcard) return null;

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Feather name="x" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.title} numberOfLines={1}>
            {flashcard.name}
          </Text>
          <TouchableOpacity onPress={() => onEdit(flashcard)} style={styles.editButton}>
            <Feather name="edit-2" size={20} color="#333" />
          </TouchableOpacity>
        </View>

        {/* Navigation indicators */}
        <View style={styles.navigationIndicator}>
          {hasPrevious && (
            <TouchableOpacity onPress={onPrevious} style={styles.navButton}>
              <Feather name="chevron-left" size={28} color="#333" />
            </TouchableOpacity>
          )}
          <View style={{ flex: 1 }} />
          {hasNext && (
            <TouchableOpacity onPress={onNext} style={styles.navButton}>
              <Feather name="chevron-right" size={28} color="#333" />
            </TouchableOpacity>
          )}
        </View>

        {/* Flashcard content */}
        <View style={styles.cardContainer}>
          <Pressable style={styles.cardWrapper} onPress={flipCard}>
            {/* Front of card (Question) */}
            <Animated.View 
              style={[
                styles.card, 
                styles.cardFront, 
                frontAnimatedStyle, 
                { opacity: flipAnimation.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 0, 0] }) }
              ]}
            >
              <Text style={styles.cardLabel}>PREGUNTA</Text>
              <ScrollView contentContainerStyle={styles.contentContainer}>
                <Text style={styles.cardText}>
                  {flashcard.question ? 
                    flashcard.question : 
                    "Sin pregunta definida"}
                </Text>
              </ScrollView>
              <View style={styles.flipInstruction}>
                <Text style={styles.flipInstructionText}>Toca para ver la respuesta</Text>
                <Feather name="refresh-cw" size={16} color="#666" />
              </View>
            </Animated.View>

            {/* Back of card (Answer) */}
            <Animated.View 
              style={[
                styles.card, 
                styles.cardBack, 
                backAnimatedStyle,
                { opacity: flipAnimation.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, 0, 1] }) }
              ]}
            >
              <Text style={styles.cardLabel}>RESPUESTA</Text>
              <ScrollView contentContainerStyle={styles.contentContainer}>
                <Text style={styles.cardText}>
                  {flashcard.answer ? 
                    flashcard.answer : 
                    "Sin respuesta definida"}
                </Text>
              </ScrollView>
              <View style={styles.flipInstruction}>
                <Text style={styles.flipInstructionText}>Toca para ver la pregunta</Text>
                <Feather name="refresh-cw" size={16} color="#666" />
              </View>
            </Animated.View>
          </Pressable>
        </View>


      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5'
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0'
  },
  closeButton: {
    padding: 6,
  },
  editButton: {
    padding: 6,
  },
  title: {
    fontSize: 18,
    fontWeight: '500',
    flex: 1,
    marginHorizontal: 16,
    color: '#333',
  },
  navigationIndicator: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  navButton: {
    padding: 8,
  },
  cardContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  cardWrapper: {
    width: '100%',
    height: '100%',
    maxHeight: height * 0.6,
    perspective: 1000,
  },
  card: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
    padding: 20,
    backfaceVisibility: 'hidden',
    position: 'absolute',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  cardFront: {
    backgroundColor: 'white',
  },
  cardBack: {
    backgroundColor: '#E8F4F8',
  },
  cardLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    fontWeight: '500',
  },
  contentContainer: {
    flexGrow: 1,
  },
  cardText: {
    fontSize: 18,
    color: '#333',
    lineHeight: 26,
  },
  flipInstruction: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
    opacity: 0.6,
  },
  flipInstructionText: {
    fontSize: 14,
    color: '#666',
    marginRight: 8,
  },
  reviewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CAF50',
    paddingVertical: 14,
    borderRadius: 8,
    margin: 16,
  },
  reviewedButton: {
    backgroundColor: '#888',
  },
  reviewButtonText: {
    color: 'white',
    fontWeight: '500',
    fontSize: 16,
    marginLeft: 8,
  },

});

export default FlashcardViewer;