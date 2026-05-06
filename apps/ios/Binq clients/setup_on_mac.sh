#!/usr/bin/env bash
set -euo pipefail

APP_NAME="Binq Client"
BUNDLE_ID="io.binq.client"
ORG="io.binq"

if ! command -v flutter >/dev/null 2>&1; then
  echo "Flutter n'est pas installé. Installe Flutter: https://docs.flutter.dev/get-started/install/macos"
  exit 1
fi

flutter pub get

if [ ! -d "ios" ]; then
  flutter create --platforms=ios --org "$ORG" .
fi

if [ -f "ios/Runner.xcodeproj/project.pbxproj" ]; then
  /usr/bin/sed -i '' "s/PRODUCT_BUNDLE_IDENTIFIER = [^;]*/PRODUCT_BUNDLE_IDENTIFIER = $BUNDLE_ID/g" ios/Runner.xcodeproj/project.pbxproj
fi

if [ -f "ios/Runner/Info.plist" ]; then
  /usr/libexec/PlistBuddy -c "Set :CFBundleDisplayName $APP_NAME" ios/Runner/Info.plist 2>/dev/null \
    || /usr/libexec/PlistBuddy -c "Add :CFBundleDisplayName string $APP_NAME" ios/Runner/Info.plist
  /usr/libexec/PlistBuddy -c "Add :NSLocationWhenInUseUsageDescription string Binq utilise votre position pour renseigner l’adresse de livraison." ios/Runner/Info.plist 2>/dev/null \
    || /usr/libexec/PlistBuddy -c "Set :NSLocationWhenInUseUsageDescription Binq utilise votre position pour renseigner l’adresse de livraison." ios/Runner/Info.plist
fi

echo "✅ $APP_NAME prêt. Lance: flutter run -d ios"
