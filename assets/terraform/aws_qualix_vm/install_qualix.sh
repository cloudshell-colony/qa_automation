#!/bin/bash -xe
echo 'nameserver 8.8.8.8' >> /etc/resolv.conf
echo 'nameserver 4.4.4.4' >> /etc/resolv.conf
curl https://quali-prod-binaries.s3.amazonaws.com/guacamole-quali-install.sh -s -o guacamole-quali-install.sh
chmod +x guacamole-quali-install.sh
touch ./disableValidateLink
./guacamole-quali-install.sh
