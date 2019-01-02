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

variable "aws_endpoints" {
  type = "map"
  default = {
    # When using localstack we will override these endpoints, see the provider config
    # to observer the endpoints used
  }
}

provider "aws" {
  region = "${var.aws_region}"

  endpoints {
    # defaults taken from https://docs.aws.amazon.com/general/latest/gr/rande.html
    s3 = "${lookup(var.aws_endpoints,"s3",join(".", list("s3",var.aws_region,"amazonaws","com")))}",
    apigateway = "${lookup(var.aws_endpoints,"apigateway",join(".", list("apigateway",var.aws_region,"amazonaws","com")))}",
    dynamodb = "${lookup(var.aws_endpoints,"dynamodb",join(".", list("dynamodb",var.aws_region,"amazonaws","com")))}",
    lambda = "${lookup(var.aws_endpoints,"lambda",join(".", list("lambda",var.aws_region,"amazonaws","com")))}"
  }
}

resource "aws_s3_bucket" "test" {
  bucket = "sl-test-app-bucket-${terraform.workspace}"
  acl = "private"
}

# dynamo db

resource "aws_dynamodb_table" "test_app_db" {
  name           = "test-app-db-${terraform.workspace}"
  billing_mode   = "PROVISIONED"
  read_capacity  = 20
  write_capacity = 20
  hash_key       = "Id"

  attribute {
    name = "Id"
    type = "S"
  }
}

# Api gateway

resource "aws_api_gateway_rest_api" "test_app_gateway" {
  name = "sl-test-app-api-${terraform.workspace}"
  description = "test app api"
  endpoint_configuration {
    types = ["REGIONAL"]
  }
}

resource "aws_api_gateway_deployment" "test_app_gateway_deployment" {
  depends_on = [
    "module.get_lambda",
    "module.delete_lambda",
    "module.upsert_lambda"
  ]
  rest_api_id = "${aws_api_gateway_rest_api.test_app_gateway.id}"
  stage_name = "test"
  // See https://github.com/hashicorp/terraform/issues/6613#issuecomment-322264393
  stage_description = "${md5(file("test.tf"))}"
}

# IAM stuff

resource "aws_iam_policy" "test_app_lambda_policy" {
  name = "sl-test-app-lambda-policy-${terraform.workspace}"
  count = 0
  path = "/"
  description = "test app lambda policy"
  policy = <<EOF
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "Stmt1476919244000",
            "Effect": "Allow",
            "Action": [
                "iam:PassRole"
            ],
            "Resource": [
                "*"
            ]
        },
        {
          "Effect": "Allow",
          "Action": [
            "logs:CreateLogGroup",
            "logs:CreateLogStream",
            "logs:PutLogEvents"
          ],
          "Resource": "arn:aws:logs:*:*:*"
        }
    ]
}
EOF
}

resource "aws_iam_role" "test_app_lambda_role" {
  name = "sl-test-app-lambda-role-${terraform.workspace}"
  count = 0
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

resource "aws_iam_role_policy_attachment" "pr-handler-attach" {
  count = 0
  role = "${aws_iam_role.test_app_lambda_role.name}"
  policy_arn = "${aws_iam_policy.test_app_lambda_policy.arn}"
}

# lambdas and gateway attachment

resource "aws_api_gateway_resource" "objects_resource" {
  rest_api_id = "${aws_api_gateway_rest_api.test_app_gateway.id}"
  parent_id = "${aws_api_gateway_rest_api.test_app_gateway.root_resource_id}"
  path_part = "objects"
}

# GET

module "get_lambda" {
  source = "./terraform_modules/simple_lambda"
  lambda_source_file = "dist/get.js"
  http_method = "GET"
  # Hack to allow us to not create iam resources with localstack
  # see https://github.com/hashicorp/terraform/issues/15281
  lambda_role_arn = "${element(concat(aws_iam_role.test_app_lambda_role.*.arn, list("")), 0)}"
  api_gateway_id = "${aws_api_gateway_rest_api.test_app_gateway.id}"
  api_gateway_execution_arn = "${aws_api_gateway_rest_api.test_app_gateway.execution_arn}"
  api_gateway_resource_id = "${aws_api_gateway_resource.objects_resource.id}"
  lambda_env_vars = {
    DYNAMO_TABLE = "${aws_dynamodb_table.test_app_db.name}"
  }
}

# DELETE

module "delete_lambda" {
  source = "./terraform_modules/simple_lambda"
  lambda_source_file = "dist/delete.js"
  http_method = "DELETE"
  # Hack to allow us to not create iam resources with localstack
  # see https://github.com/hashicorp/terraform/issues/15281
  lambda_role_arn = "${element(concat(aws_iam_role.test_app_lambda_role.*.arn, list("")), 0)}"
  api_gateway_id = "${aws_api_gateway_rest_api.test_app_gateway.id}"
  api_gateway_execution_arn = "${aws_api_gateway_rest_api.test_app_gateway.execution_arn}"
  api_gateway_resource_id = "${aws_api_gateway_resource.objects_resource.id}"
  lambda_env_vars = {
    DYNAMO_TABLE = "${aws_dynamodb_table.test_app_db.name}"
  }
}

# POST

module "upsert_lambda" {
  source = "./terraform_modules/simple_lambda"
  lambda_source_file = "dist/upsert.js"
  http_method = "POST"
  # Hack to allow us to not create iam resources with localstack
  # see https://github.com/hashicorp/terraform/issues/15281
  lambda_role_arn = "${element(concat(aws_iam_role.test_app_lambda_role.*.arn, list("")), 0)}"
  api_gateway_id = "${aws_api_gateway_rest_api.test_app_gateway.id}"
  api_gateway_execution_arn = "${aws_api_gateway_rest_api.test_app_gateway.execution_arn}"
  api_gateway_resource_id = "${aws_api_gateway_resource.objects_resource.id}"
  lambda_env_vars = {
    DYNAMO_TABLE = "${aws_dynamodb_table.test_app_db.name}"
  }
}

# OUTPUT

# this file contains outputs that need to be used in e.g. tests to locate the endpoints to test

resource "local_file" "ouput_vars" {
  content  = "${jsonencode(map("root_url",aws_api_gateway_resource.objects_resource.path))}"
  filename = "terraform_outputs.json"
}