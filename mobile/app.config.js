export default {
  expo: {
    name: "JJ-Meet",
    slug: "jj-meet",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "jjmeet",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    splash: {
      image: "./assets/images/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.jjmeet.app",
      infoPlist: {
        NSLocationWhenInUseUsageDescription: "JJ-Meet needs your location to find nearby users",
        NSLocationAlwaysUsageDescription: "JJ-Meet uses your location to show you nearby travelers and guides",
        NSCameraUsageDescription: "JJ-Meet needs camera access for profile photos",
        NSPhotoLibraryUsageDescription: "JJ-Meet needs photo library access for profile photos"
      }
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/images/adaptive-icon.png",
        backgroundColor: "#ffffff"
      },
      package: "com.jjmeet.app",
      permissions: [
        "ACCESS_COARSE_LOCATION",
        "ACCESS_FINE_LOCATION",
        "CAMERA",
        "READ_EXTERNAL_STORAGE"
      ]
    },
    web: {
      bundler: "metro",
      output: "static",
      favicon: "./assets/images/favicon.png"
    },
    plugins: [
      "expo-router",
      "expo-secure-store",
      [
        "expo-splash-screen",
        {
          image: "./assets/images/splash-icon.png",
          imageWidth: 200,
          resizeMode: "contain",
          backgroundColor: "#ffffff"
        }
      ]
    ],
    experiments: {
      typedRoutes: true
    },
    extra: {
      apiUrl: process.env.EXPO_PUBLIC_API_URL || "http://localhost:5000",
      socketUrl: process.env.EXPO_PUBLIC_SOCKET_URL || "http://localhost:5000",
      eas: {
        projectId: "your-project-id"
      }
    }
  }
};
