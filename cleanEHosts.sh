#! /bin/bash
kubectl delete namespace `kubectl get namespaces | grep $1 | awk '{print $1}'`