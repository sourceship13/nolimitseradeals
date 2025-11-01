export BUNDLE_GEMFILE=../Gemfile
export APP_ID="${APP_ID}"                       # from step 2 (optional if you baked it in)
export GOOGLE_PLAY_JSON="$HOME/.credentials/play-service-account.json"  # or set SUPPLY_JSON_KEY_DATA

bundle exec fastlane lanes
bundle exec fastlane android build_aab --verbose
