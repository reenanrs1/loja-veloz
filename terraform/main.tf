terraform {
  required_version = ">= 1.0.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  # Configuração recomendada para ambiente real (Backend S3 + DynamoDB para Lock de estado)
  # backend "s3" {
  #   bucket         = "loja-veloz-tfstate"
  #   key            = "prod/terraform.tfstate"
  #   region         = "us-east-1"
  #   dynamodb_table = "loja-veloz-tflocks"
  # }
}

provider "aws" {
  region = var.aws_region
}

# ------------------------------------------------------------------------------
# VARIÁVEIS PRINCIPAIS
# ------------------------------------------------------------------------------
variable "aws_region" {
  description = "Região da AWS para deploy"
  type        = string
  default     = "us-east-1"
}

variable "cluster_name" {
  description = "Nome do Cluster Kubernetes (EKS)"
  type        = string
  default     = "loja-veloz-eks"
}

# ------------------------------------------------------------------------------
# MÓDULO 1: REDE VIRTUAL (VPC) COM SUBNETS PÚBLICAS E PRIVADAS
# ------------------------------------------------------------------------------
module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "~> 5.0"

  name = "loja-veloz-vpc"
  cidr = "10.0.0.0/16"

  azs             = ["${var.aws_region}a", "${var.aws_region}b"]
  private_subnets = ["10.0.1.0/24", "10.0.2.0/24"]
  public_subnets  = ["10.0.101.0/24", "10.0.102.0/24"]

  enable_nat_gateway   = true
  single_nat_gateway   = true
  enable_dns_hostnames = true

  tags = {
    Environment = "production"
    Project     = "LojaVeloz"
    ManagedBy   = "Terraform"
  }
}

# ------------------------------------------------------------------------------
# MÓDULO 2: CLUSTER KUBERNETES GERENCIADO (AWS EKS)
# ------------------------------------------------------------------------------
module "eks" {
  source  = "terraform-aws-modules/eks/aws"
  version = "~> 19.0"

  cluster_name    = var.cluster_name
  cluster_version = "1.28"

  cluster_endpoint_public_access = true

  vpc_id     = module.vpc.vpc_id
  subnet_ids = module.vpc.private_subnets

  eks_managed_node_groups = {
    default_nodes = {
      min_size     = 2
      max_size     = 10
      desired_size = 3

      instance_types = ["t3.medium"]
      capacity_type  = "ON_DEMAND"
    }
  }

  tags = {
    Environment = "production"
    Project     = "LojaVeloz"
    ManagedBy   = "Terraform"
  }
}

# ------------------------------------------------------------------------------
# OUTPUTS
# ------------------------------------------------------------------------------
output "cluster_endpoint" {
  description = "Endpoint de comunicação do cluster EKS"
  value       = module.eks.cluster_endpoint
}

output "cluster_name" {
  description = "Nome do cluster EKS provisionado"
  value       = module.eks.cluster_name
}
