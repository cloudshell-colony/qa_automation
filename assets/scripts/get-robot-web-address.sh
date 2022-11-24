echo "Getting frontend service address"
sleep 20s
export POD_NAME=$(kubectl get pods -n torque-sandboxes --sort-by=.metadata.creationTimestamp --no-headers | grep web- | tac | awk 'NR==1{print $1}')
export ENV_ID=$(kubectl get pod $POD_NAME -n torque-sandboxes -o jsonpath="{.metadata.labels.torque-environment-id}" | awk '{print tolower($0)}')

export frontend=$(kubectl get service web-$ENV_ID -n torque-sandboxes --no-headers | awk '{print $4}')

echo $frontend
