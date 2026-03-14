package com.medlens

import android.content.Context
import android.graphics.Bitmap
import org.tensorflow.lite.Interpreter
import java.io.FileInputStream
import java.nio.ByteBuffer
import java.nio.ByteOrder
import java.nio.MappedByteBuffer
import java.nio.channels.FileChannel

data class ClassificationResult(val label: String, val confidence: Float)

class PillClassifier(private val context: Context) {

    companion object {
        private const val MODEL_FILE = "pill_classifier.tflite"
        private const val LABELS_FILE = "pill_labels.txt"
        private const val INPUT_SIZE = 224
        private const val CHANNELS = 3
        private const val BYTES_PER_FLOAT = 4
        // MobileNet-style normalisation: pixels → [-1, 1]
        private const val IMAGE_MEAN = 127.5f
        private const val IMAGE_STD = 127.5f
    }

    private val interpreter: Interpreter by lazy { buildInterpreter() }
    private val labels: List<String> by lazy { loadLabels() }

    private fun buildInterpreter(): Interpreter {
        val options = Interpreter.Options().apply {
            numThreads = 2
            useNNAPI = true // hardware acceleration where available
        }
        return Interpreter(loadModel(), options)
    }

    private fun loadModel(): MappedByteBuffer {
        val fd = context.assets.openFd(MODEL_FILE)
        return FileInputStream(fd.fileDescriptor).channel.map(
            FileChannel.MapMode.READ_ONLY,
            fd.startOffset,
            fd.declaredLength,
        )
    }

    private fun loadLabels(): List<String> =
        context.assets.open(LABELS_FILE).bufferedReader().readLines()

    fun classify(frame: ProcessedFrame): ClassificationResult {
        val scaled = Bitmap.createScaledBitmap(frame.bitmap, INPUT_SIZE, INPUT_SIZE, true)
        val inputBuffer = bitmapToBuffer(scaled)
        val output = Array(1) { FloatArray(labels.size) }

        interpreter.run(inputBuffer, output)

        val scores = output[0]
        val best = scores.indices.maxByOrNull { scores[it] } ?: 0
        return ClassificationResult(
            label = labels.getOrElse(best) { "Unknown" },
            confidence = scores[best],
        )
    }

    private fun bitmapToBuffer(bitmap: Bitmap): ByteBuffer {
        val buf = ByteBuffer
            .allocateDirect(INPUT_SIZE * INPUT_SIZE * CHANNELS * BYTES_PER_FLOAT)
            .apply { order(ByteOrder.nativeOrder()) }

        val pixels = IntArray(INPUT_SIZE * INPUT_SIZE)
        bitmap.getPixels(pixels, 0, bitmap.width, 0, 0, bitmap.width, bitmap.height)

        for (px in pixels) {
            buf.putFloat(((px shr 16 and 0xFF) - IMAGE_MEAN) / IMAGE_STD) // R
            buf.putFloat(((px shr 8 and 0xFF) - IMAGE_MEAN) / IMAGE_STD)  // G
            buf.putFloat(((px and 0xFF) - IMAGE_MEAN) / IMAGE_STD)         // B
        }
        return buf
    }

    fun close() {
        interpreter.close()
    }
}
