# echo "2- plan path is: $TORQUE_TF_PLAN_PATH"
# echo "$TORQUE_TF_EXECUTABLE -chdir=$TORQUE_TF_MODULE_PATH state rm $1"
[4:36 PM] Shira Ben-Dor

if grep -q 'Plan: [1-9][0-9]* to add, 0 to change, 0 to destroy' "$TORQUE_TF_PLAN_PATH"; then
  echo "Error: The plan indicates new resources"
  exit 1
else
  echo "Success: No new resources added."
  exit 0



