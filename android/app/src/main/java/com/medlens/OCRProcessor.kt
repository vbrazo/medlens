package com.medlens

import android.graphics.BitmapFactory
import com.google.mlkit.vision.common.InputImage
import com.google.mlkit.vision.text.TextRecognition
import com.google.mlkit.vision.text.latin.TextRecognizerOptions
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlin.coroutines.resume
import kotlin.coroutines.resumeWithException

class OCRProcessor {

    private val recognizer =
        TextRecognition.getClient(TextRecognizerOptions.DEFAULT_OPTIONS)

    /**
     * Extract text from an image file path.
     * Runs ML Kit on the calling (IO) coroutine and returns the recognised text,
     * or an empty string if nothing could be read.
     */
    suspend fun extractText(imagePath: String): String {
        val bitmap = BitmapFactory.decodeFile(imagePath) ?: return ""
        val image = InputImage.fromBitmap(bitmap, 0)
        return runRecognition(image)
    }

    private suspend fun runRecognition(image: InputImage): String =
        suspendCancellableCoroutine { cont ->
            recognizer.process(image)
                .addOnSuccessListener { result ->
                    // Join all recognised lines into a single string
                    val text = result.textBlocks
                        .flatMap { it.lines }
                        .joinToString(" ") { it.text }
                        .trim()
                    cont.resume(text)
                }
                .addOnFailureListener { e ->
                    cont.resumeWithException(e)
                }
        }

    fun close() {
        recognizer.close()
    }
}
