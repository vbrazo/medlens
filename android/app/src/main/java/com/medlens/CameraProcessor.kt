package com.medlens

import android.graphics.Bitmap
import android.graphics.BitmapFactory
import org.opencv.android.Utils
import org.opencv.core.Mat
import org.opencv.core.Size
import org.opencv.imgproc.Imgproc

data class ProcessedFrame(val mat: Mat, val bitmap: Bitmap)

class CameraProcessor {

    /**
     * Load an image from disk, apply grayscale + blur + adaptive threshold,
     * and return both the OpenCV Mat and a Bitmap for TFLite input.
     */
    fun preprocess(imagePath: String): ProcessedFrame {
        val original = BitmapFactory.decodeFile(imagePath)
            ?: throw IllegalArgumentException("Cannot decode image: $imagePath")

        val mat = Mat()
        Utils.bitmapToMat(original, mat)

        // Convert to grayscale
        Imgproc.cvtColor(mat, mat, Imgproc.COLOR_BGR2GRAY)

        // Gaussian blur — reduces sensor noise before edge detection
        Imgproc.GaussianBlur(mat, mat, Size(5.0, 5.0), 0.0)

        // Adaptive threshold handles uneven lighting conditions
        Imgproc.adaptiveThreshold(
            mat, mat, 255.0,
            Imgproc.ADAPTIVE_THRESH_GAUSSIAN_C,
            Imgproc.THRESH_BINARY,
            11, 2.0,
        )

        val processedBitmap =
            Bitmap.createBitmap(mat.cols(), mat.rows(), Bitmap.Config.ARGB_8888)
        Utils.matToBitmap(mat, processedBitmap)

        return ProcessedFrame(mat, processedBitmap)
    }

    /**
     * Detect circular pill regions using Hough circle transform.
     * Returns a Mat where each column is (x, y, radius) of a detected circle.
     */
    fun detectPillRegions(frame: ProcessedFrame): Mat {
        val circles = Mat()
        Imgproc.HoughCircles(
            frame.mat,
            circles,
            Imgproc.HOUGH_GRADIENT,
            1.0,    // dp — inverse ratio of accumulator resolution
            50.0,   // minDist — min distance between circle centers
            100.0,  // param1 — upper Canny threshold
            30.0,   // param2 — accumulator threshold
            10,     // minRadius
            150,    // maxRadius
        )
        return circles
    }
}
