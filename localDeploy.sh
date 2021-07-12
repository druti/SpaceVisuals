docker build -t space-visuals .

echo "Tagging image file"
docker tag space-visuals:latest dokku/space-visuals:latest
echo "Deploying image from tag latest"
dokku tags:deploy space-visuals latest
echo "Finished..."
