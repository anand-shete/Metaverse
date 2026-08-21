#!/usr/bin/env bash

set -euo pipefail

APP_DIR="${APP_DIR:-$HOME/metaverse}"
AWS_REGION="${AWS_REGION:-ap-south-1}"
IMAGE_TAG="${IMAGE_TAG:-latest}"

echo "=== Deployment Started ==="
echo "APP_DIR=${APP_DIR}"
echo "IMAGE_TAG=${IMAGE_TAG}"
echo "AWS_REGION=${AWS_REGION}"

if [[ ! -d "$APP_DIR" ]]; then
	echo "App directory not found: $APP_DIR"
	exit 1
fi

cd "$APP_DIR"

if [[ ! -f compose.yml ]]; then
	echo "Missing compose.yml in $APP_DIR"
	exit 1
fi

if [[ ! -f .env.production ]]; then
	echo "Missing .env.production in $APP_DIR"
	echo "Copy apps/api/.env.production to the server once before deploying."
	exit 1
fi

if [[ -z "${ECR_REGISTRY:-}" ]]; then
	AWS_ACCOUNT_ID="$(aws sts get-caller-identity --profile ${AWS_PROFILE} --query Account --output text)"
	ECR_REGISTRY="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"
fi

export ECR_REGISTRY IMAGE_TAG AWS_REGION AWS_PROFILE


echo "Logging into ECR: ${ECR_REGISTRY}"
aws ecr get-login-password --region "$AWS_REGION" --profile ${AWS_PROFILE} \
	| docker login --username AWS --password-stdin "$ECR_REGISTRY"

echo "Pulling and starting containers..."
docker compose pull api
docker compose up -d --remove-orphans

echo "Cleaning unused images..."
docker image prune -f

echo "=== Deployment Finished ==="
docker compose ps
