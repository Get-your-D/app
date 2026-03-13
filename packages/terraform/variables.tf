variable "aws_region" {
  description = "AWS region for deployment"
  type        = string
  default     = "eu-west-1"
}

variable "environment" {
  description = "Environment (development, staging, production)"
  type        = string
  validation {
    condition     = contains(["development", "staging", "production"], var.environment)
    error_message = "Environment must be development, staging, or production."
  }
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "private_subnets" {
  description = "Private subnet CIDR blocks"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
}

variable "public_subnets" {
  description = "Public subnet CIDR blocks"
  type        = list(string)
  default     = ["10.0.101.0/24", "10.0.102.0/24", "10.0.103.0/24"]
}

variable "database_subnets" {
  description = "Database subnet CIDR blocks"
  type        = list(string)
  default     = ["10.0.201.0/24", "10.0.202.0/24", "10.0.203.0/24"]
}

variable "elasticache_subnets" {
  description = "ElastiCache subnet CIDR blocks"
  type        = list(string)
  default     = ["10.0.211.0/24", "10.0.212.0/24", "10.0.213.0/24"]
}

variable "rds_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.r6g.large"
  validation {
    condition     = can(regex("^db\\..*", var.rds_instance_class))
    error_message = "Must be a valid RDS instance class."
  }
}

variable "redis_instance_type" {
  description = "ElastiCache Redis node type"
  type        = string
  default     = "cache.r6g.large"
}

variable "ecs_task_cpu" {
  description = "ECS task CPU units"
  type        = string
  default     = "512"
}

variable "ecs_task_memory" {
  description = "ECS task memory in MB"
  type        = string
  default     = "1024"
}

variable "ecs_desired_count" {
  description = "Desired number of ECS tasks"
  type        = number
  default     = 2
  validation {
    condition     = var.ecs_desired_count >= 1
    error_message = "Desired count must be at least 1."
  }
}

variable "api_image_uri" {
  description = "Docker image URI for API"
  type        = string
}

variable "web_image_uri" {
  description = "Docker image URI for web frontend"
  type        = string
}

variable "enable_monitoring" {
  description = "Enable CloudWatch monitoring and alarms"
  type        = bool
  default     = true
}

variable "enable_backup" {
  description = "Enable automated backups"
  type        = bool
  default     = true
}

variable "backup_retention_days" {
  description = "Number of days to retain backups"
  type        = number
  default     = 30
  validation {
    condition     = var.backup_retention_days >= 7 && var.backup_retention_days <= 35
    error_message = "Backup retention must be between 7 and 35 days."
  }
}

variable "tags" {
  description = "Additional tags to apply to all resources"
  type        = map(string)
  default = {
    Project    = "HealthcarePlatform"
    Compliance = "GDPR-TISAX-C3"
  }
}

variable "log_retention_days" {
  description = "CloudWatch log retention in days"
  type        = number
  default     = 30
}

variable "enable_performance_insights" {
  description = "Enable RDS Performance Insights"
  type        = bool
  default     = true
}

variable "multi_az_deployment" {
  description = "Enable Multi-AZ deployment"
  type        = bool
  default     = true
}

variable "deletion_protection" {
  description = "Enable deletion protection (prevent accidental termination)"
  type        = bool
  default     = true
}

locals {
  common_tags = merge(
    var.tags,
    {
      Environment = var.environment
      ManagedBy   = "Terraform"
      CreatedAt   = timestamp()
    }
  )
}
