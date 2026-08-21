variable "aws_region" {
  description = "AWS region to deploy into."
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Short name used as a prefix for all resource names."
  type        = string
  default     = "skillforge"
}

variable "db_master_username" {
  description = "Master username for the DocumentDB cluster."
  type        = string
  default     = "skillforge_admin"
}

variable "db_master_password" {
  description = "Master password for the DocumentDB cluster. Supply via TF_VAR_db_master_password or a secrets manager — never commit a real value."
  type        = string
  sensitive   = true
}

variable "docdb_instance_class" {
  description = "Instance class for DocumentDB cluster instances."
  type        = string
  default     = "db.t3.medium"
}

variable "docdb_instance_count" {
  description = "Number of DocumentDB instances in the cluster."
  type        = number
  default     = 1
}

variable "backend_cpu" {
  description = "Fargate CPU units for the backend task."
  type        = number
  default     = 512
}

variable "backend_memory" {
  description = "Fargate memory (MB) for the backend task."
  type        = number
  default     = 1024
}

variable "jwt_secret" {
  description = "JWT signing secret for the backend. Supply via TF_VAR_jwt_secret or a secrets manager."
  type        = string
  sensitive   = true
}

variable "ai_api_key" {
  description = "Optional AI provider API key. Leave empty to run the app in deterministic fallback mode."
  type        = string
  sensitive   = true
  default     = ""
}
