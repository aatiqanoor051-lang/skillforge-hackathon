output "alb_dns_name" {
  description = "Public DNS name of the Application Load Balancer. Point your domain's CNAME/ALIAS here."
  value       = aws_lb.skillforge.dns_name
}

output "docdb_cluster_endpoint" {
  description = "DocumentDB (MongoDB-compatible) cluster endpoint."
  value       = aws_docdb_cluster.skillforge.endpoint
  sensitive   = true
}

output "ecr_backend_repository_url" {
  value = aws_ecr_repository.backend.repository_url
}

output "ecr_python_service_repository_url" {
  value = aws_ecr_repository.python_service.repository_url
}

output "ecr_frontend_repository_url" {
  value = aws_ecr_repository.frontend.repository_url
}

output "ecs_cluster_name" {
  value = aws_ecs_cluster.skillforge.name
}
