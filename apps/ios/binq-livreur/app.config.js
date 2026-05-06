module.exports = {
  expo: {
    name: "Binq Livreur",
    slug: "binq-livreur-ios",
    scheme: "binqlivreur",
    version: "0.1.0",
    orientation: "portrait",
    userInterfaceStyle: "light",
    ios: {
      bundleIdentifier: "io.binq.livreur",
      supportsTablet: false,
      infoPlist: {
        NSLocationWhenInUseUsageDescription: "Binq utilise votre position pour vous guider vers le client pendant la livraison."
      }
    },
    plugins: [["@rnmapbox/maps", { RNMapboxMapsDownloadToken: process.env.MAPBOX_DOWNLOADS_TOKEN || "" }]],
    extra: {
      appRole: "livreur",
      apiUrl: process.env.EXPO_PUBLIC_BINQ_API_URL || "https://binq.io",
      supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL || "",
      supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || "",
      mapboxToken: process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN || ""
    }
  }
};
