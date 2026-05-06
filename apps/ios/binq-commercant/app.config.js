module.exports = {
  expo: {
    name: "Binq Commerçant",
    slug: "binq-commercant-ios",
    scheme: "binqcommercant",
    version: "0.1.0",
    orientation: "portrait",
    userInterfaceStyle: "light",
    ios: {
      bundleIdentifier: "io.binq.commercant",
      supportsTablet: false,
      infoPlist: {
        NSLocationWhenInUseUsageDescription: "Binq utilise la position de votre commerce pour améliorer les livraisons locales."
      }
    },
    plugins: [["@rnmapbox/maps", { RNMapboxMapsDownloadToken: process.env.MAPBOX_DOWNLOADS_TOKEN || "" }]],
    extra: {
      appRole: "commercant",
      apiUrl: process.env.EXPO_PUBLIC_BINQ_API_URL || "https://binq.io",
      supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL || "",
      supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || "",
      mapboxToken: process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN || ""
    }
  }
};
