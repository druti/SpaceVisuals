sudo rm -r build/
npm run build

docker build -t space-visuals .
rm space-visuals.tar
docker save space-visuals > space-visuals.tar

ssh -i ./.ssh/id_rsa_passless root@143.110.222.91 "rm space-visuals.tar"
scp -o IdentityFile=./.ssh/id_rsa_passless space-visuals.tar root@143.110.222.91:/root/

ssh -t -i ./.ssh/id_rsa_passless root@143.110.222.91 << EOF
  echo "Loading image file"
  docker load < space-visuals.tar
  echo "Tagging image file"
  docker tag space-visuals:latest dokku/space-visuals:latest
  echo "Deploying image from tag latest"
  dokku tags:deploy space-visuals latest
  echo "Finished..."
EOF
