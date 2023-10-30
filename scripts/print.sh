#!/bin/bash

expected_path="/workspace/terraform.plan"
path="$TORQUE_TF_PLAN_PATH"
  echo $path
if [["$path" == *"$expected_path"*]]; then
  echo "path is valid: '$path'"
else
  echo "Error: path ('$path') is not a part of the expected path ('$expected_path')."
  exit 1
fi






# echo "2- plan path is: $TORQUE_TF_PLAN_PATH"
# echo "$TORQUE_TF_EXECUTABLE -chdir=$TORQUE_TF_MODULE_PATH state rm $1"
# #!/bin/bash

# # Define some variables
# first_name="John"
# last_name="Doe"
# age=30

# # Construct a command using variables
# command="echo My name is $first_name $last_name, and I am $age years old."

# # Execute the command
# $command

# !/bin/bash

# expected_agent="qa-eks"
# input_agent="{{ .inputs.agent }}"

# if [ "$input_agent" != "$expected_agent" ]; then
#   echo "{{ .inputs.agent }}"
#   echo "Error: Input agent does not match the expected value ('$expected_agent')."
#   exit 1
# fi

# echo "Input agent is valid: '$input_agent'"










