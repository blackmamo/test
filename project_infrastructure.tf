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

variable "app_name" {
  default = "test-app"
}

variable "aws_endpoints" {
  type = "map"
  default = {
    # When using localstack we will override these endpoints, see the provider config
    # to observer the endpoints used
  }
}

# Hack used with localstack, it doesn't handle iam and we don't want our local test creating
# real permissions
variable "manage_iam" {
  default = true
}

provider "aws" {
  region = "${var.aws_region}"
  # needed for terraform's s3 impl
  s3_force_path_style = true

  endpoints {
    # defaults taken from https://docs.aws.amazon.com/general/latest/gr/rande.html
    s3 = "${lookup(var.aws_endpoints,"s3",join(".", list("s3",var.aws_region,"amazonaws","com")))}",
    apigateway = "${lookup(var.aws_endpoints,"apigateway",join(".", list("apigateway",var.aws_region,"amazonaws","com")))}",
    dynamodb = "${lookup(var.aws_endpoints,"dynamodb",join(".", list("dynamodb",var.aws_region,"amazonaws","com")))}",
    lambda = "${lookup(var.aws_endpoints,"lambda",join(".", list("lambda",var.aws_region,"amazonaws","com")))}"
  }
}

# front end app bucket

module "front_end" {
  source = "ui/sample_react_ui"
  app_name = "${var.app_name}"
}


# Api gateway

resource "aws_api_gateway_rest_api" "api_gateway" {
  name = "sl-${var.app_name}-api-${terraform.workspace}"
  description = "test app api"
  endpoint_configuration {
    types = ["REGIONAL"]
  }
}

resource "aws_api_gateway_deployment" "test_app_gateway_deployment" {
  depends_on = [
    "module.objects_api"
  ]
  rest_api_id = "${aws_api_gateway_rest_api.api_gateway.id}"
  stage_name = "test"
  // TODO try and limit the scope of the md5 hash to just those things that require
  // a redeploy of the stage by moving them into a separate module
  // See https://github.com/hashicorp/terraform/issues/6613#issuecomment-322264393
  stage_description = "${md5(file("project_infrastructure.tf"))} ${md5(file("terraform_modules/simple_lambda/main.tf"))} ${md5(file("lambda/objects_api/main.tf"))}"
}

resource "aws_iam_role" "lambda_role" {
  name = "sl-${var.app_name}-lambda-role-${terraform.workspace}"
  count = "${var.manage_iam}"
  assume_role_policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Action": "sts:AssumeRole",
      "Principal": {
        "Service": "lambda.amazonaws.com"
      },
      "Effect": "Allow",
      "Sid": ""
    }
  ]
}
EOF
}

module "objects_api" {
  source = "lambda/objects_api"
  lambda_role_name = "${aws_iam_role.lambda_role.name}"
  manage_iam = "${var.manage_iam}"
  app_name = "${var.app_name}"
  lambda_role_arn = "${element(concat(aws_iam_role.lambda_role.*.arn, list("")), 0)}"
  api_gateway_execution_root_resource = "${aws_api_gateway_rest_api.api_gateway.root_resource_id}"
  api_gateway_id = "${aws_api_gateway_rest_api.api_gateway.id}"
  api_gateway_execution_arn = "${aws_api_gateway_rest_api.api_gateway.execution_arn}"
}

# this file contains outputs that need to be used in e.g. tests to locate the endpoints to test

resource "local_file" "ouput_vars" {
  # Sorry - https://github.com/hashicorp/hcl/issues/211
  content  = "${jsonencode(map("root_url", aws_api_gateway_deployment.test_app_gateway_deployment.invoke_url, "objects_path", module.objects_api.objects_path, "localstack", var.manage_iam, "front_end_url", module.front_end.website_endpoint))}"
  filename = "terraform_outputs.json"
}