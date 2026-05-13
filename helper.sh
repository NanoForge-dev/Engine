for package in packages/*; do
  packageName=$(basename $package)
  echo "Building $package"
  pnpm exec mint-tsdocs init -p $package --yes
  jq '.outputFolder="../../docs/'$packageName'"' "$package/mint-tsdocs.config.json" > tmp.json && mv tmp.json $package/mint-tsdocs.config.json
done
