#!/bin/bash

'''
First off, you need to do this first.

if [ "$USER" != "root" ]; then 🥲
    echo "You must use sudo for every docker operation or add your user to the docker group else it will throw an error."
fi
    echo "You are the root bud, go crazy ."🤪 

'''


# Set AWS credentials path as an environment variable
# This env variable will be gone after the script has been executed.
# Don't worry about your credentials path being exposed xD
# But make sure you set the right file permisson cuz that's the best practice -,-
export AWS_SHARED_CREDENTIALS_FILE="/home/zeno/.aws/credentials"

# ECR and Image Variables
ECR_Registry="982534378917.dkr.ecr.ap-southeast-2.amazonaws.com"
ImageRepositoryName="web_demo" #This here is the name of the ECR repository in aws and it comes after ${ECR_Registry} /web_demo
ImageTag="test_version"
ECR_Repo_Name="${ECR_Registry}/${ImageRepositoryName}:${ImageTag}" # 982534378917.dkr.ecr.ap-southeast-2.amazonaws.com/web_demo:test_version
AWS_Region="ap-southeast-2"

# Docker Build Variables
Image_Name="web_demo" #This is just the naming for local docker image build process
Image_Dir="./dockerfiles/"
Dockerfile_Path="./dockerfiles/web_demo_dockerfile"

# Step 1: Authenticate with AWS ECR to push and pull the images
echo "Attempting to log in to ${ECR_Registry}/${ImageRepositoryName} in ${AWS_Region}..."
aws ecr get-login-password --region "${AWS_Region}" | docker login --username AWS --password-stdin "${ECR_Registry}"

# Check if login was successful
if [ $? -ne 0 ]; then
    echo "Repository login failed. Exiting."
    exit 1
fi

# Step 2: Build the image locally
echo "Building Docker image: ${Image_Name}:${ImageTag}"
docker build "${Image_Dir}" --file "${Dockerfile_Path}" --tag "${Image_Name}:${ImageTag}"

# Check if build was successful
if [ $? -ne 0 ]; then
    echo "Docker image build failed. Exiting."
    exit 1
fi

# Step 3: Tag the image with the ecr repository before pushing
echo "Tagging the image with the ECR repository URI: ${ECR_Repo_Name}"
docker tag "${Image_Name}:${ImageTag}" "${ECR_Repo_Name}"


# Step 4: Push the image into the repository
echo "Pushing Docker image to ${ECR_Repo_Name}"
docker push "${ECR_Repo_Name}"

# Check if push was successful
if [ $? -ne 0 ]; then
    echo "Docker image push failed. Exiting."
    exit 1
fi

echo "Docker image build and push completed successfully."

# Step 5: Clean Up
# Log out of ECR to clear credentials
docker logout "${ECR_Registry}"