package com.medlens

import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.WritableNativeMap
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch

class MedLensModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    private val scope = CoroutineScope(Dispatchers.IO + SupervisorJob())
    private val cameraProcessor = CameraProcessor()
    private val pillClassifier by lazy { PillClassifier(reactContext) }
    private val ocrProcessor = OCRProcessor()

    override fun getName(): String = "MedLensModule"

    @ReactMethod
    fun analyzeImage(imagePath: String, promise: Promise) {
        scope.launch {
            try {
                // 1. Preprocess image with OpenCV
                val frame = cameraProcessor.preprocess(imagePath)

                // 2. Run TFLite pill classifier
                val classifierResult = pillClassifier.classify(frame)

                // 3. Run ML Kit OCR (used as fallback / cross-validation)
                val ocrText = ocrProcessor.extractText(imagePath)

                // Prefer classifier label; fall back to OCR if confidence is low
                val medication = if (classifierResult.confidence >= 0.6f) {
                    classifierResult.label
                } else {
                    ocrText.ifBlank { classifierResult.label }
                }

                val result = WritableNativeMap().apply {
                    putString("medication", medication)
                    putDouble("confidence", classifierResult.confidence.toDouble())
                    putBoolean("verified", classifierResult.confidence >= 0.85f)
                }

                promise.resolve(result)
            } catch (e: Exception) {
                promise.reject("ANALYZE_ERROR", e.message ?: "Unknown error", e)
            }
        }
    }
}
