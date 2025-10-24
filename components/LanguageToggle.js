import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../contexts/LanguageContext';

const LanguageToggle = ({ style, textStyle, showText = true }) => {
  const { currentLanguage, toggleLanguage, isChangingLanguage } = useLanguage();

  return (
    <TouchableOpacity 
      onPress={toggleLanguage} 
      style={[styles.container, style]}
      disabled={isChangingLanguage}
    >
      {isChangingLanguage ? (
        <ActivityIndicator size="small" color="#215433" />
      ) : (
        <>
          <Ionicons 
            name="globe-outline" 
            size={18} 
            color="#215433" 
            style={styles.icon} 
          />
          {showText && (
            <Text style={[styles.text, textStyle]}>
              {currentLanguage === 'en' ? 'العربية' : 'English'}
            </Text>
          )}
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(33, 84, 51, 0.1)',
  },
  icon: {
    marginRight: 6,
  },
  text: {
    fontSize: 14,
    fontWeight: '600',
    color: '#215433',
  },
});

export default LanguageToggle;
