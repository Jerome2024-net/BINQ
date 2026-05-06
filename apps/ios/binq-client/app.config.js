module.exports = {
  expo: {
    name: "Binq Client",
    slug: "binq-client-ios",
    scheme: "binqclient",
    version: "0.1.0",
    orientation: "portrait",
    userInterfaceStyle: "light",
    ios: {
      bundleIdentifier: "io.binq.client",
      supportsTablet: false,
      infoPlist: {
        NSLocationWhenInUseUsageDescription: "Binq utilise votre position pour renseigner l’adresse de livraison et suivre votre commande."
      }
    },
    plugins: [["@rnmapbox/maps", { RNMapboxMapsDownloadToken: process.env.MAPBOX_DOWNLOADS_TOKEN || "" }]],
    extra: {
      appRole: "client",
      apiUrl: process.env.EXPO_PUBLIC_BINQ_API_URL || "https://binq.io",
      supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL || "",
      supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || "",
      mapboxToken: process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN || ""
    }
  }
};
