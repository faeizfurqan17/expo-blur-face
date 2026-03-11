import { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { blurFaces, type BlurFacesResult } from 'expo-blur-face';

export default function App() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<BlurFacesResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Options
  const [blurIntensity, setBlurIntensity] = useState(30);
  const [padding, setPadding] = useState(10);

  const intensityOptions = [15, 30, 50, 80];
  const paddingOptions = [0, 10, 20, 40];

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;

    const pickerResult = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 1,
    });

    if (!pickerResult.canceled && pickerResult.assets[0]) {
      setSelectedImage(pickerResult.assets[0].uri);
      setResult(null);
      setError(null);
    }
  };

  const startBlurring = async () => {
    if (!selectedImage) return;

    setProcessing(true);
    setError(null);
    setResult(null);

    try {
      const blurResult = await blurFaces(selectedImage, {
        blurIntensity,
        padding,
        output: 'jpg',
        quality: 0.9,
      });
      setResult(blurResult);
    } catch (e: any) {
      setError(e.message || 'An error occurred');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Expo Blur Face</Text>
        <Text style={styles.subtitle}>On-device face detection & blurring</Text>

        {/* Pick Image */}
        <TouchableOpacity style={styles.pickButton} onPress={pickImage}>
          <Text style={styles.pickButtonText}>Pick an Image</Text>
        </TouchableOpacity>

        {/* Original Image Preview */}
        {selectedImage && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Original</Text>
            <Image source={{ uri: selectedImage }} style={styles.imagePreview} resizeMode="contain" />
          </View>
        )}

        {/* Options */}
        {selectedImage && !processing && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Blur Intensity</Text>
            <View style={styles.optionRow}>
              {intensityOptions.map((val) => (
                <TouchableOpacity
                  key={val}
                  style={[styles.optionPill, blurIntensity === val && styles.optionPillActive]}
                  onPress={() => setBlurIntensity(val)}
                >
                  <Text style={[styles.optionText, blurIntensity === val && styles.optionTextActive]}>
                    {val}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.sectionTitle}>Padding</Text>
            <View style={styles.optionRow}>
              {paddingOptions.map((val) => (
                <TouchableOpacity
                  key={val}
                  style={[styles.optionPill, padding === val && styles.optionPillActive]}
                  onPress={() => setPadding(val)}
                >
                  <Text style={[styles.optionText, padding === val && styles.optionTextActive]}>
                    {val}px
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Blur Button */}
            <TouchableOpacity style={styles.blurButton} onPress={startBlurring}>
              <Text style={styles.blurButtonText}>Blur Faces</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Processing */}
        {processing && (
          <View style={styles.processingContainer}>
            <ActivityIndicator size="large" color="#7C5CFC" />
            <Text style={styles.processingText}>Detecting & blurring faces...</Text>
          </View>
        )}

        {/* Error */}
        {error && (
          <View style={styles.errorCard}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Result */}
        {result && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Result</Text>

            <View style={styles.resultCard}>
              <Text style={styles.resultStat}>
                Faces detected: <Text style={styles.resultValue}>{result.facesDetected}</Text>
              </Text>
            </View>

            {result.facesDetected > 0 ? (
              <Image source={{ uri: result.uri }} style={styles.imagePreview} resizeMode="contain" />
            ) : (
              <Text style={styles.noFacesText}>No faces found — original image returned.</Text>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0F',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginTop: 10,
  },
  subtitle: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginBottom: 24,
  },
  pickButton: {
    backgroundColor: '#1A1A2E',
    borderWidth: 1,
    borderColor: '#2A2A40',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  pickButtonText: {
    color: '#7C5CFC',
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#CCC',
    marginBottom: 10,
  },
  imagePreview: {
    width: '100%',
    height: 300,
    borderRadius: 12,
    backgroundColor: '#1A1A2E',
  },
  optionRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  optionPill: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#1A1A2E',
    borderWidth: 1,
    borderColor: '#2A2A40',
  },
  optionPillActive: {
    backgroundColor: '#7C5CFC',
    borderColor: '#7C5CFC',
  },
  optionText: {
    color: '#888',
    fontSize: 14,
    fontWeight: '500',
  },
  optionTextActive: {
    color: '#FFFFFF',
  },
  blurButton: {
    backgroundColor: '#7C5CFC',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 4,
  },
  blurButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  processingContainer: {
    alignItems: 'center',
    paddingVertical: 30,
    gap: 12,
  },
  processingText: {
    color: '#888',
    fontSize: 14,
  },
  errorCard: {
    backgroundColor: '#2D1515',
    borderColor: '#FF4444',
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  errorText: {
    color: '#FF6666',
    fontSize: 14,
  },
  resultCard: {
    backgroundColor: '#152D1A',
    borderColor: '#44FF66',
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  resultStat: {
    color: '#AAA',
    fontSize: 14,
  },
  resultValue: {
    color: '#44FF66',
    fontWeight: '700',
  },
  noFacesText: {
    color: '#888',
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 20,
  },
});
