FROM node:18@sha256:9d8a6466c6385e05f62f8ccf173e80209efb0ff4438f321f09ddf552b05af3ba
# Install Kubectl
RUN curl -LO https://dl.k8s.io/release/v1.23.0/bin/linux/amd64/kubectl &&\
    install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl
# Install AWS CLI
RUN apt-get update && apt-get install unzip &&\
    curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip" &&\
    unzip awscliv2.zip &&\
    ./aws/install 
# Install node modules from pacakge json
WORKDIR /usr/
COPY ./package.json /usr/
RUN npm i