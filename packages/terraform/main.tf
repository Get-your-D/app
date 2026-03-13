terraform {
  required_version = ">= 1.0"
  
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  backend "s3" {
    bucket         = "healthcare-terraform-state"
    key            = "production/terraform.tfstate"
    region         = "eu-west-1"
    encrypt        = true
    dynamodb_table = "terraform-locks"
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Environment = var.environment
      Project     = "HealthcarePlatform"
      Compliance  = "GDPR-TISAX-C3"
      ManagedBy   = "Terraform"
    }
  }
}

# VPC and Networking
module "vpc" {
  source = "terraform-aws-modules/vpc/aws"
  version = "5.0.0"

  name = "healthcare-vpc-${var.environment}"
  cidr = var.vpc_cidr

  azs             = data.aws_availability_zones.available.names
  private_subnets = var.private_subnets
  public_subnets  = var.public_subnets

  enable_nat_gateway = true
  single_nat_gateway = var.environment == "production" ? false : true
  enable_vpn_gateway = true

  enable_dns_hostnames = true
  enable_dns_support   = true

  enable_flow_log                      = true
  create_flow_log_cloudwatch_iam_role  = true
  create_flow_log_cloudwatch_log_group = true

  tags = {
    Name = "healthcare-vpc-${var.environment}"
  }
}

# Security Group for RDS
resource "aws_security_group" "rds" {
  name_prefix = "healthcare-rds-"
  vpc_id      = module.vpc.vpc_id

  ingress {
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = [var.vpc_cidr]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "healthcare-rds-sg"
  }
}

# RDS PostgreSQL Cluster (Aurora for high availability)
module "rds_aurora" {
  source = "terraform-aws-modules/rds-aurora/aws"
  version = "8.0.0"

  name           = "healthcare"
  engine         = "aurora-postgresql"
  engine_version = "16.2"
  family         = "aurora-postgresql16"
  major_version  = "16"

  instances = {
    one = {
      instance_class   = var.rds_instance_class
      publicly_accessible = false
    }
    two = {
      instance_class   = var.rds_instance_class
      publicly_accessible = false
    }
  }

  # Database configuration
  database_name   = "healthcare"
  master_username = "postgres"
  manage_master_user_password = true
  master_user_secret_kms_key_id = aws_kms_key.rds.id

  # Storage encryption
  storage_encrypted = true
  kms_key_id        = aws_kms_key.rds.arn

  # Backup and retention
  backup_retention_period      = 30
  preferred_backup_window      = "03:00-04:00"
  preferred_maintenance_window = "mon:04:00-mon:05:00"
  copy_tags_to_snapshot        = true
  skip_final_snapshot          = false
  final_snapshot_identifier    = "healthcare-final-snapshot-${formatdate("YYYY-MM-DD-hhmm", timestamp())}"

  # Monitoring
  enabled_cloudwatch_logs_exports = ["postgresql"]
  create_security_group           = false
  vpc_security_group_ids          = [aws_security_group.rds.id]
  db_subnet_group_name            = module.vpc.database_subnet_group_name

  # GDPR compliance
  enable_http_endpoint = true
  enable_s3_import     = true
  enable_s3_export     = true

  tags = {
    Environment = var.environment
    Compliance  = "GDPR"
  }
}

# ElastiCache Redis Cluster for sessions
module "elasticache" {
  source = "terraform-aws-modules/elasticache/aws"
  version = "1.1.0"

  name           = "healthcare-cache"
  engine         = "redis"
  engine_version = "7.0"
  node_type      = var.redis_instance_type
  num_cache_nodes = var.environment == "production" ? 3 : 1
  
  parameter_group_family = "redis7"
  
  # Automatic failover
  automatic_failover_enabled = var.environment == "production"
  multi_az_enabled           = var.environment == "production"

  # Encryption
  at_rest_encryption_enabled = true
  transit_encryption_enabled = true
  auth_token_enabled         = true
  auth_token                 = random_password.redis_auth_token.result
  kms_key_id                 = aws_kms_key.redis.id

  # Securityports
  security_group_ids = [aws_security_group.redis.id]
  subnet_group_name  = module.vpc.elasticache_subnet_group_name

  # Automatic backup
  automatic_backup_enabled = true
  backup_retention_in_days = 7
  preferred_backup_window  = "03:00-05:00"

  # Logging
  log_delivery_configuration = {
    slow_log = {
      cloudwatch_log_group      = aws_cloudwatch_log_group.redis_slow_log.name
      cloudwatch_log_group_arn  = aws_cloudwatch_log_group.redis_slow_log.arn
      enabled                   = true
      log_format                = "json"
    }
  }

  tags = {
    Environment = var.environment
    Compliance  = "GDPR"
  }
}

# KMS Keys for encryption
resource "aws_kms_key" "rds" {
  description             = "KMS key for RDS encryption (GDPR compliance)"
  deletion_window_in_days = 30
  enable_key_rotation     = true

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "Enable IAM User Permissions"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Action   = "kms:*"
        Resource = "*"
      },
      {
        Sid    = "Allow RDS"
        Effect = "Allow"
        Principal = {
          Service = "rds.amazonaws.com"
        }
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey",
          "kms:CreateGrant"
        ]
        Resource = "*"
      }
    ]
  })

  tags = {
    Name = "healthcare-rds-key"
  }
}

resource "aws_kms_key" "redis" {
  description             = "KMS key for Redis encryption"
  deletion_window_in_days = 30
  enable_key_rotation     = true

  tags = {
    Name = "healthcare-redis-key"
  }
}

# CloudWatch Logs for Redis
resource "aws_cloudwatch_log_group" "redis_slow_log" {
  name              = "/aws/elasticache/healthcare/slow-log"
  retention_in_days = 30

  tags = {
    Name = "healthcare-redis-logs"
  }
}

# Security Group for Redis
resource "aws_security_group" "redis" {
  name_prefix = "healthcare-redis-"
  vpc_id      = module.vpc.vpc_id

  ingress {
    from_port   = 6379
    to_port     = 6379
    protocol    = "tcp"
    cidr_blocks = [var.vpc_cidr]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "healthcare-redis-sg"
  }
}

# Redis Auth Token
resource "random_password" "redis_auth_token" {
  length  = 32
  special = true
}

# Secrets Manager for credentials
resource "aws_secretsmanager_secret" "db_credentials" {
  name                    = "healthcare/rds/credentials"
  description             = "RDS database credentials (managed by Aurora)"
  recovery_window_in_days = 7
  kms_key_id              = aws_kms_key.rds.id

  tags = {
    Name = "healthcare-rds-credentials"
  }
}

resource "aws_secretsmanager_secret" "redis_auth_token_secret" {
  name                    = "healthcare/redis/auth-token"
  description             = "Redis AUTH token"
  recovery_window_in_days = 7
  kms_key_id              = aws_kms_key.redis.id

  secret_string = random_password.redis_auth_token.result

  tags = {
    Name = "healthcare-redis-auth"
  }
}

# CloudWatch Alarms for RDS
resource "aws_cloudwatch_metric_alarm" "rds_cpu" {
  alarm_name          = "healthcare-rds-cpu-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/RDS"
  period              = 300
  statistic           = "Average"
  threshold           = 80
  alarm_description   = "Alert when RDS CPU exceeds 80%"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    DBClusterIdentifier = module.rds_aurora.cluster_id
  }
}

resource "aws_cloudwatch_metric_alarm" "rds_storage" {
  alarm_name          = "healthcare-rds-storage-low"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = 1
  metric_name         = "FreeStorageSpace"
  namespace           = "AWS/RDS"
  period              = 300
  statistic           = "Average"
  threshold           = 5368709120 # 5GB
  alarm_description   = "Alert when RDS storage is below 5GB"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    DBClusterIdentifier = module.rds_aurora.cluster_id
  }
}

# SNS Topic for Alerts
resource "aws_sns_topic" "alerts" {
  name              = "healthcare-alerts-${var.environment}"
  kms_master_key_id = "alias/aws/sns"

  tags = {
    Name = "healthcare-alerts"
  }
}

# Data sources
data "aws_caller_identity" "current" {}
data "aws_availability_zones" "available" {
  state = "available"
}

# Outputs
output "rds_cluster_endpoint" {
  value       = module.rds_aurora.cluster_endpoint
  description = "RDS cluster endpoint"
  sensitive   = true
}

output "rds_reader_endpoint" {
  value       = module.rds_aurora.cluster_reader_endpoint
  description = "RDS read replica endpoint"
  sensitive   = true
}

output "redis_endpoint" {
  value       = module.elasticache.endpoint
  description = "Redis cluster endpoint"
  sensitive   = true
}

output "redis_auth_token_secret_arn" {
  value       = aws_secretsmanager_secret.redis_auth_token_secret.arn
  description = "ARN of Redis auth token in Secrets Manager"
}

output "db_credentials_secret_arn" {
  value       = aws_secretsmanager_secret.db_credentials.arn
  description = "ARN of RDS credentials in Secrets Manager"
}
