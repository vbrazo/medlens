# React Native
-keep class com.facebook.react.** { *; }
-keep class com.facebook.hermes.** { *; }
-keep class com.facebook.jni.** { *; }

# TensorFlow Lite
-keep class org.tensorflow.lite.** { *; }
-keepclassmembers class org.tensorflow.lite.** { *; }

# ML Kit
-keep class com.google.mlkit.** { *; }
-keep class com.google.android.gms.internal.mlkit_vision_text_latin.** { *; }

# OpenCV
-keep class org.opencv.** { *; }

# MedLens native module
-keep class com.medlens.MedLensModule { *; }
-keep class com.medlens.MedLensPackage { *; }
