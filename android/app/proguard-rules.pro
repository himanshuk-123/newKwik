# Add project specific ProGuard rules here.
# By default, the flags in this file are appended to flags specified
# in /usr/local/Cellar/android-sdk/24.3.3/tools/proguard/proguard-android.txt
# You can edit the include path and order by changing the proguardFiles
# directive in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# Add any project specific keep options here:
# React Native
-keep class com.facebook.react.** { *; }
-keep class com.facebook.hermes.** { *; }
-keep class com.swmansion.** { *; }
-keep class expo.** { *; }
-keep class com.airbnb.android.react.** { *; }
-keep class com.google.android.gms.** { *; }
-keep class com.facebook.jni.** { *; }
-keep class com.facebook.proguard.** { *; }
-keep class com.facebook.soloader.** { *; }
-keep class com.facebook.react.turbomodule.** { *; }
-keep class com.facebook.react.uimanager.** { *; }
-keep class com.facebook.react.modules.** { *; }
-keep class com.facebook.react.bridge.** { *; }
-keep class com.facebook.react.packagerconnection.** { *; }
-keep class com.facebook.react.devsupport.** { *; }
-keep class com.facebook.react.module.model.** { *; }
-keep class com.facebook.react.module.** { *; }
-keep class com.facebook.react.module.annotations.** { *; }
-keep class com.facebook.react.module.model.** { *; }
-keep class com.facebook.react.module.annotations.** { *; }
-keep class com.facebook.react.module.** { *; }
-keep class com.facebook.react.module.model.** { *; }
-keep class com.facebook.react.module.annotations.** { *; }
-keep class com.facebook.react.module.** { *; }
-keep class com.facebook.react.module.model.** { *; }
-keep class com.facebook.react.module.annotations.** { *; }
# Hermes
-keep class com.facebook.hermes.** { *; }
# Prevent removal of native methods
-keepclasseswithmembers class * {
	native <methods>;
}
# Keep all annotations
-keepattributes *Annotation*
