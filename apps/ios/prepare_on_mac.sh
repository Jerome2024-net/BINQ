#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"

if ! command -v flutter >/dev/null 2>&1; then
  echo "Flutter n'est pas installé. Installe Flutter avant de continuer."
  exit 1
fi

if ! command -v pod >/dev/null 2>&1; then
  echo "CocoaPods n'est pas installé. Lance: sudo gem install cocoapods"
  exit 1
fi

prepare_app() {
  local dir="$1"
  local org="$2"
  local bundle_id="$3"
  local display_name="$4"

  echo "\n=== Préparation $display_name ==="
  cd "$ROOT_DIR/$dir"

  flutter pub get

  if [ ! -d "ios" ]; then
    flutter create --platforms=ios --org "$org" .
  fi

  if [ -f "ios/Runner.xcodeproj/project.pbxproj" ]; then
    /usr/bin/sed -i '' "s/PRODUCT_BUNDLE_IDENTIFIER = [^;]*/PRODUCT_BUNDLE_IDENTIFIER = $bundle_id/g" ios/Runner.xcodeproj/project.pbxproj
  fi

  if [ -f "ios/Runner/Info.plist" ]; then
    /usr/libexec/PlistBuddy -c "Set :CFBundleDisplayName $display_name" ios/Runner/Info.plist 2>/dev/null \
      || /usr/libexec/PlistBuddy -c "Add :CFBundleDisplayName string $display_name" ios/Runner/Info.plist
    /usr/libexec/PlistBuddy -c "Add :NSLocationWhenInUseUsageDescription string Binq utilise votre position pour les fonctionnalités de livraison locale." ios/Runner/Info.plist 2>/dev/null \
      || /usr/libexec/PlistBuddy -c "Set :NSLocationWhenInUseUsageDescription Binq utilise votre position pour les fonctionnalités de livraison locale." ios/Runner/Info.plist
  fi

  cd "$ROOT_DIR"
}

prepare_app "Binq clients" "io.binq" "io.binq.client" "Binq Client"
prepare_app "Binq livreur" "io.binq" "io.binq.livreur" "Binq Livreur"
prepare_app "Binq commercant" "io.binq" "io.binq.commercant" "Binq Commerçant"

echo "\n✅ Les trois projets iOS Flutter sont prêts sur ce Mac."
