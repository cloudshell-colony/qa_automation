echo "Getting External IP from service"
sleep 60s
export POD_NAME=$(kubectl get pods -n sandbox --sort-by=.metadata.creationTimestamp --no-headers | grep guacamole | tac | awk 'NR==1{print $1}')
export ENV_ID=$(kubectl get pod $POD_NAME -n sandbox -o jsonpath="{.metadata.labels.torque-environment-id}" | awk '{print tolower($0)}')
export qualix_ip=$(kubectl get service guacamole-$ENV_ID -n sandbox -o jsonpath="{.status.loadBalancer.ingress[0].ip}")
export qualix_hostname=$(kubectl get service guacamole-$ENV_ID -n sandbox -o jsonpath="{.status.loadBalancer.ingress[0].hostname}")
export qualix_outbound_ip=$(kubectl exec -i -n sandbox $POD_NAME -c guacamole-$ENV_ID -- sh -c "curl icanhazip.com" | tr -d '\n') 
kubectl exec -i -n sandbox $POD_NAME -c guacamole-$ENV_ID -- sh -c "touch /disableValidateLink"

echo $qualix_ip
echo $qualix_hostname
echo $qualix_outbound_ip
