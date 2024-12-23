
DOCKER_COMPOSE_FILE = docker-compose.yaml
DOCKER_IMAGE = deployment_backend:latest
BACKEND_DIR = backend
FRONTEND_DIR = frontend
DEPLOYMENT_DIR =deployment

# 默认目标
all: build

check_and_stop:
	@if docker-compose -f deployment/$(DOCKER_COMPOSE_FILE) ps -q | grep -q .; then \
		echo "Stopping running Docker Compose services..."; \
		docker-compose -f deployment/$(DOCKER_COMPOSE_FILE) stop; \
	fi

remove_docker_image:
	@if docker images -q $(DOCKER_IMAGE) | grep -q .; then \
		echo "Removing Docker image $(DOCKER_IMAGE)..."; \
		docker rmi -f $(DOCKER_IMAGE); \
	fi

build_backend:
	cd $(BACKEND_DIR) && docker build -t ${DOCKER_IMAGE} -f .dockerfile .


build_frontend:
	cd $(FRONTEND_DIR) && npm install && npm run build


up_docker_compose:
	cd ${DEPLOYMENT_DIR} && docker-compose -f $(DOCKER_COMPOSE_FILE) up -d

build: check_and_stop remove_docker_image build_backend build_frontend 

run: up_docker_compose

all: build run

clean:
	cd $(BACKEND_DIR) && go clean
	cd $(FRONTEND_DIR) && npm cache clean --force
