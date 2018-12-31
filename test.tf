terraform {
  backend "s3" {
    bucket = "sl-terraform-backend"
    key = "terraform.tfstate"
    region = "eu-west-1"
  }
}

variable "aws_region" {
  default = "eu-west-1"
}

provider "aws" {
  region = "${var.aws_region}"
}

resource "aws_s3_bucket" "test" {
  bucket = "sl-${terraform.workspace}-test-bucket"
  acl = "private"
}