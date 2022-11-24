echo "Getting External IP from service"
sleep 20s
export qualix_ip=$(kubectl get service guacamole -n sandbox -o jsonpath="{.status.loadBalancer.ingress[0].ip}")
export qualix_hostname=$(kubectl get service guacamole -n sandbox -o jsonpath="{.status.loadBalancer.ingress[0].hostname}")
export POD_NAME=$(kubectl get pods -n sandbox --sort-by=.metadata.creationTimestamp --no-headers | grep guacamole | tac | awk 'NR==1{print $1}')
export qualix_outbound_ip=$(kubectl exec -i -t -n sandbox $POD_NAME -c guacamole -- sh -c "curl icanhazip.com" | tr -d '\n')
kubectl exec -i -t -n sandbox $POD_NAME -c guacamole -- sh -c "touch /disableValidateLink"
echo $qualix_ip
echo $qualix_hostname
echo $qualix_outbound_ip
