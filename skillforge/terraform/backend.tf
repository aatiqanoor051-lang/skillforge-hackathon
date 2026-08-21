# Remote state configuration (recommended for any real/shared usage).
# Uncomment and fill in with your own bucket/table after creating them
# out-of-band (Terraform cannot safely bootstrap its own state backend).
#
# terraform {
#   backend "s3" {
#     bucket         = "your-skillforge-tfstate-bucket"
#     key            = "skillforge/terraform.tfstate"
#     region         = "us-east-1"
#     dynamodb_table = "skillforge-tfstate-lock"
#     encrypt        = true
#   }
# }
