# ==============================================================================
# SkillForge — Reference Terraform for AWS (ECS Fargate + DocumentDB + ALB)
# ==============================================================================
# This is a reference architecture, not a turnkey one-command deploy. Review
# instance sizes, CIDR ranges, and IAM policies against your organization's
# requirements before applying. Remote state (S3 + DynamoDB lock table) is
# recommended for any real usage — see backend.tf.

terraform {
  required_version = ">= 1.6.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

# ------------------------------ Networking ------------------------------ #

resource "aws_vpc" "skillforge" {
  cidr_block           = "10.20.0.0/16"
  enable_dns_support   = true
  enable_dns_hostnames = true
  tags = { Name = "${var.project_name}-vpc" }
}

resource "aws_internet_gateway" "skillforge" {
  vpc_id = aws_vpc.skillforge.id
  tags   = { Name = "${var.project_name}-igw" }
}

resource "aws_subnet" "public" {
  count                   = 2
  vpc_id                  = aws_vpc.skillforge.id
  cidr_block              = cidrsubnet(aws_vpc.skillforge.cidr_block, 8, count.index)
  availability_zone       = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = true
  tags                    = { Name = "${var.project_name}-public-${count.index}" }
}

resource "aws_subnet" "private" {
  count             = 2
  vpc_id            = aws_vpc.skillforge.id
  cidr_block        = cidrsubnet(aws_vpc.skillforge.cidr_block, 8, count.index + 10)
  availability_zone = data.aws_availability_zones.available.names[count.index]
  tags              = { Name = "${var.project_name}-private-${count.index}" }
}

data "aws_availability_zones" "available" {
  state = "available"
}

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.skillforge.id
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.skillforge.id
  }
  tags = { Name = "${var.project_name}-public-rt" }
}

resource "aws_route_table_association" "public" {
  count          = length(aws_subnet.public)
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

# ------------------------------ Security groups ------------------------------ #

resource "aws_security_group" "alb" {
  name_prefix = "${var.project_name}-alb-"
  vpc_id      = aws_vpc.skillforge.id

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_security_group" "ecs_service" {
  name_prefix = "${var.project_name}-ecs-"
  vpc_id      = aws_vpc.skillforge.id

  ingress {
    from_port       = 0
    to_port         = 65535
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_security_group" "docdb" {
  name_prefix = "${var.project_name}-docdb-"
  vpc_id      = aws_vpc.skillforge.id

  ingress {
    from_port       = 27017
    to_port         = 27017
    protocol        = "tcp"
    security_groups = [aws_security_group.ecs_service.id]
  }
}

# ------------------------------ DocumentDB (Mongo-compatible) ------------------------------ #

resource "aws_docdb_subnet_group" "skillforge" {
  name       = "${var.project_name}-docdb-subnets"
  subnet_ids = aws_subnet.private[*].id
}

resource "aws_docdb_cluster" "skillforge" {
  cluster_identifier      = "${var.project_name}-docdb"
  engine                  = "docdb"
  master_username         = var.db_master_username
  master_password         = var.db_master_password
  db_subnet_group_name    = aws_docdb_subnet_group.skillforge.name
  vpc_security_group_ids  = [aws_security_group.docdb.id]
  skip_final_snapshot     = true
  storage_encrypted       = true
  backup_retention_period = 7
}

resource "aws_docdb_cluster_instance" "skillforge" {
  count              = var.docdb_instance_count
  identifier         = "${var.project_name}-docdb-${count.index}"
  cluster_identifier = aws_docdb_cluster.skillforge.id
  instance_class     = var.docdb_instance_class
}

# ------------------------------ ECS cluster ------------------------------ #

resource "aws_ecs_cluster" "skillforge" {
  name = "${var.project_name}-cluster"
  setting {
    name  = "containerInsights"
    value = "enabled"
  }
}

resource "aws_ecr_repository" "backend" {
  name                 = "${var.project_name}-backend"
  image_tag_mutability = "IMMUTABLE"
}

resource "aws_ecr_repository" "python_service" {
  name                 = "${var.project_name}-python-service"
  image_tag_mutability = "IMMUTABLE"
}

resource "aws_ecr_repository" "frontend" {
  name                 = "${var.project_name}-frontend"
  image_tag_mutability = "IMMUTABLE"
}

# ------------------------------ Load balancer ------------------------------ #

resource "aws_lb" "skillforge" {
  name               = "${var.project_name}-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = aws_subnet.public[*].id
}

resource "aws_lb_target_group" "backend" {
  name        = "${var.project_name}-backend-tg"
  port        = 5000
  protocol    = "HTTP"
  vpc_id      = aws_vpc.skillforge.id
  target_type = "ip"
  health_check {
    path                = "/health"
    healthy_threshold   = 2
    unhealthy_threshold = 3
    interval            = 30
    timeout             = 5
  }
}

resource "aws_lb_target_group" "frontend" {
  name        = "${var.project_name}-frontend-tg"
  port        = 80
  protocol    = "HTTP"
  vpc_id      = aws_vpc.skillforge.id
  target_type = "ip"
  health_check {
    path                = "/"
    healthy_threshold   = 2
    unhealthy_threshold = 3
    interval            = 30
    timeout             = 5
  }
}

resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.skillforge.arn
  port              = 80
  protocol          = "HTTP"
  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.frontend.arn
  }
}
