docker build -t space-visuals .
rm space-visuals.tar
docker save space-visuals > space-visuals.tar

echo "Loading image file"
docker load < space-visuals.tar
echo "Tagging image file"
docker tag space-visuals:latest dokku/space-visuals:latest
echo "Deploying image from tag latest"
dokku tags:deploy space-visuals latest
echo "Finished..."
