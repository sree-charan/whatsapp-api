#!/bin/bash

# WhatsApp API Platform - Docker Build Script
set -e

# Configuration
DOCKER_USERNAME="${DOCKER_USERNAME:-your-dockerhub-username}"
IMAGE_NAME="whatsapp-api-platform"
VERSION="${VERSION:-latest}"
FULL_IMAGE_NAME="${DOCKER_USERNAME}/${IMAGE_NAME}:${VERSION}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is running
check_docker() {
    if ! docker info >/dev/null 2>&1; then
        log_error "Docker is not running. Please start Docker and try again."
        exit 1
    fi
}

# Build the image
build_image() {
    log_info "Building Docker image: ${FULL_IMAGE_NAME}"
    
    # Build the image
    docker build \
        --tag "${FULL_IMAGE_NAME}" \
        --tag "${DOCKER_USERNAME}/${IMAGE_NAME}:latest" \
        --file Dockerfile \
        .
    
    log_success "Image built successfully!"
}

# Test the image
test_image() {
    log_info "Testing the built image..."
    
    # Run a quick test
    CONTAINER_ID=$(docker run -d \
        --name whatsapp-api-test \
        -p 8080:80 \
        "${FULL_IMAGE_NAME}")
    
    # Wait for container to start
    sleep 10
    
    # Test health endpoint
    if curl -f http://localhost:8080/health >/dev/null 2>&1; then
        log_success "Image test passed!"
    else
        log_warning "Health check failed, but image might still be working"
    fi
    
    # Cleanup test container
    docker stop "${CONTAINER_ID}" >/dev/null 2>&1
    docker rm "${CONTAINER_ID}" >/dev/null 2>&1
}

# Push to Docker Hub
push_image() {
    log_info "Pushing image to Docker Hub..."
    
    # Check if logged in
    if ! docker info | grep -q "Username:"; then
        log_warning "Not logged in to Docker Hub. Please run: docker login"
        read -p "Do you want to login now? (y/n): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            docker login
        else
            log_error "Cannot push without Docker Hub login"
            exit 1
        fi
    fi
    
    # Push both tags
    docker push "${FULL_IMAGE_NAME}"
    docker push "${DOCKER_USERNAME}/${IMAGE_NAME}:latest"
    
    log_success "Image pushed successfully!"
}

# Show image info
show_info() {
    echo ""
    log_info "Image Information:"
    echo "  Image Name: ${FULL_IMAGE_NAME}"
    echo "  Image Size: $(docker images --format "table {{.Size}}" "${FULL_IMAGE_NAME}" | tail -n +2)"
    echo "  Created: $(docker images --format "table {{.CreatedAt}}" "${FULL_IMAGE_NAME}" | tail -n +2)"
    echo ""
    log_info "Usage:"
    echo "  docker run -d -p 80:80 ${FULL_IMAGE_NAME}"
    echo "  docker-compose up -d"
    echo ""
}

# Main script
main() {
    echo "🐳 WhatsApp API Platform - Docker Build Script"
    echo "================================================"
    
    # Parse arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --username)
                DOCKER_USERNAME="$2"
                FULL_IMAGE_NAME="${DOCKER_USERNAME}/${IMAGE_NAME}:${VERSION}"
                shift 2
                ;;
            --version)
                VERSION="$2"
                FULL_IMAGE_NAME="${DOCKER_USERNAME}/${IMAGE_NAME}:${VERSION}"
                shift 2
                ;;
            --push)
                PUSH_IMAGE=true
                shift
                ;;
            --no-test)
                NO_TEST=true
                shift
                ;;
            --help)
                echo "Usage: $0 [OPTIONS]"
                echo ""
                echo "Options:"
                echo "  --username USERNAME    Docker Hub username (default: your-dockerhub-username)"
                echo "  --version VERSION      Image version tag (default: latest)"
                echo "  --push                 Push to Docker Hub after building"
                echo "  --no-test             Skip image testing"
                echo "  --help                Show this help message"
                echo ""
                echo "Environment Variables:"
                echo "  DOCKER_USERNAME       Docker Hub username"
                echo "  VERSION               Image version tag"
                exit 0
                ;;
            *)
                log_error "Unknown option: $1"
                echo "Use --help for usage information"
                exit 1
                ;;
        esac
    done
    
    # Validate Docker username
    if [[ "${DOCKER_USERNAME}" == "your-dockerhub-username" ]]; then
        log_warning "Using default Docker username. Set DOCKER_USERNAME environment variable or use --username option."
        read -p "Enter your Docker Hub username: " DOCKER_USERNAME
        FULL_IMAGE_NAME="${DOCKER_USERNAME}/${IMAGE_NAME}:${VERSION}"
    fi
    
    # Check prerequisites
    check_docker
    
    # Build the image
    build_image
    
    # Test the image (unless skipped)
    if [[ "${NO_TEST}" != "true" ]]; then
        test_image
    fi
    
    # Push if requested
    if [[ "${PUSH_IMAGE}" == "true" ]]; then
        push_image
    fi
    
    # Show final information
    show_info
    
    log_success "Build process completed!"
    
    if [[ "${PUSH_IMAGE}" != "true" ]]; then
        echo ""
        log_info "To push this image to Docker Hub, run:"
        echo "  $0 --push"
        echo "  or manually: docker push ${FULL_IMAGE_NAME}"
    fi
}

# Run main function
main "$@" 