import React, {useCallback, useRef, useState} from 'react';
import {View, Text, StyleSheet, TouchableOpacity, Alert} from 'react-native';
import {useCameraDevice, Camera} from 'react-native-vision-camera';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import type {RootStackParamList} from '../../App';
import CameraPreview from '../components/CameraPreview';
import {MedLensModule} from '../native/MedLensModule';
import {useMedicationStore} from '../store/medicationStore';

type ScannerNavProp = NativeStackNavigationProp<RootStackParamList, 'Scanner'>;

export default function ScannerScreen() {
  const navigation = useNavigation<ScannerNavProp>();
  const device = useCameraDevice('back');
  const camera = useRef<Camera>(null);
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<{
    medication: string;
    confidence: number;
    verified: boolean;
  } | null>(null);
  const addScan = useMedicationStore(s => s.addScan);

  const handleScan = useCallback(async () => {
    if (!camera.current || scanning) {
      return;
    }
    setScanning(true);
    try {
      const photo = await camera.current.takePhoto({flash: 'off'});
      const analysisResult = await MedLensModule.analyzeImage(photo.path);
      setResult(analysisResult);
      addScan(analysisResult);
    } catch (e) {
      Alert.alert('Scan failed', (e as Error).message);
    } finally {
      setScanning(false);
    }
  }, [scanning, addScan]);

  if (!device) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>No camera available</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraPreview device={device} cameraRef={camera} result={result} />

      <View style={styles.controls}>
        {result && (
          <View style={styles.resultBox}>
            <Text style={styles.resultIcon}>✓</Text>
            <View style={styles.resultMeta}>
              <Text style={styles.resultName}>{result.medication} detected</Text>
              <Text style={styles.resultConf}>
                Confidence: {Math.round(result.confidence * 100)}%
              </Text>
            </View>
            <View
              style={[
                styles.verifiedBadge,
                result.verified ? styles.verifiedGood : styles.verifiedBad,
              ]}>
              <Text style={styles.verifiedText}>
                {result.verified ? 'Verified' : 'Low conf.'}
              </Text>
            </View>
          </View>
        )}

        <TouchableOpacity
          style={[styles.scanButton, scanning && styles.scanButtonDisabled]}
          onPress={handleScan}
          disabled={scanning}>
          <Text style={styles.scanButtonText}>
            {scanning ? 'Scanning...' : 'Scan Medication'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.dashButton}
          onPress={() => navigation.navigate('Dashboard')}>
          <Text style={styles.dashButtonText}>View Dashboard</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#000'},
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000',
  },
  errorText: {color: '#fff', fontSize: 16},
  controls: {padding: 20, backgroundColor: '#111'},
  resultBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a3a1a',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    gap: 8,
  },
  resultIcon: {color: '#4caf50', fontSize: 22, fontWeight: '700'},
  resultMeta: {flex: 1},
  resultName: {color: '#fff', fontSize: 15, fontWeight: '600'},
  resultConf: {color: '#aaa', fontSize: 13, marginTop: 2},
  verifiedBadge: {paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10},
  verifiedGood: {backgroundColor: '#2e7d32'},
  verifiedBad: {backgroundColor: '#7d2e2e'},
  verifiedText: {color: '#fff', fontSize: 11, fontWeight: '600'},
  scanButton: {
    backgroundColor: '#2196f3',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginBottom: 8,
  },
  scanButtonDisabled: {backgroundColor: '#444'},
  scanButtonText: {color: '#fff', fontSize: 16, fontWeight: '600'},
  dashButton: {padding: 12, alignItems: 'center'},
  dashButtonText: {color: '#888', fontSize: 14},
});
