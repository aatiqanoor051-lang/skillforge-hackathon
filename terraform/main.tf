terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 4.0"
    }
  }
}

provider "aws" {
  region = "us-east-1"
}

resource "aws_s3_bucket" "skillforge_bucket" {
  bucket = "skillforge-hackathon-media-assets"

  tags = {
    Name        = "SkillForge Assets"
    Environment = "Production"
  }
}
