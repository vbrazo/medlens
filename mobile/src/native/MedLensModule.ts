import {NativeModules, Platform} from 'react-native';

export interface AnalysisResult {
  medication: string;
  confidence: number;
  verified: boolean;
}

interface MedLensNativeModule {
  analyzeImage(imagePath: string): Promise<AnalysisResult>;
}

if (Platform.OS !== 'android') {
  console.warn('MedLensModule is only available on Android');
}

export const MedLensModule: MedLensNativeModule = NativeModules.MedLensModule;
