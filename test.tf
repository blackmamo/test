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
  bucket = "sl-test-app-bucket-${terraform.workspace}"
  acl = "private"
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
    "aws_api_gateway_method.objects_get",
    "aws_api_gateway_method.objects_delete",
    "aws_api_gateway_method.objects_upsert"
  ]
  rest_api_id = "${aws_api_gateway_rest_api.test_app_gateway.id}"
  stage_name = "test"
  // See https://github.com/hashicorp/terraform/issues/6613#issuecomment-322264393
  stage_description = "${md5(file("test.tf"))}"
}

# IAM stuff

resource "aws_iam_policy" "test_app_lambda_policy" {
  name = "sl-test-app-lambda-policy-${terraform.workspace}"
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
  role = "${aws_iam_role.test_app_lambda_role.name}"
  policy_arn = "${aws_iam_policy.test_app_lambda_policy.arn}"
}

# lambdas and gateway attachment

resource "aws_api_gateway_resource" "objects_resource" {
  rest_api_id = "${aws_api_gateway_rest_api.test_app_gateway.id}"
  parent_id = "${aws_api_gateway_rest_api.test_app_gateway.root_resource_id}"
  path_part = "objects"
}

resource "aws_api_gateway_method" "objects_delete" {
  rest_api_id = "${aws_api_gateway_rest_api.test_app_gateway.id}"
  resource_id = "${aws_api_gateway_resource.objects_resource.id}"
  http_method = "DELETE"
  authorization = "NONE"
}

resource "aws_api_gateway_method" "objects_get" {
  rest_api_id = "${aws_api_gateway_rest_api.test_app_gateway.id}"
  resource_id = "${aws_api_gateway_resource.objects_resource.id}"
  http_method = "GET"
  authorization = "NONE"
}

resource "aws_api_gateway_method" "objects_upsert" {
  rest_api_id = "${aws_api_gateway_rest_api.test_app_gateway.id}"
  resource_id = "${aws_api_gateway_resource.objects_resource.id}"
  http_method = "POST"
  authorization = "NONE"
}

# GET

data "archive_file" "get_zip" {
  type = "zip"
  source_file = "dist/get.js"
  output_path = "dist/get.zip"
}

resource "aws_lambda_function" "test_app_get" {
  filename = "${data.archive_file.get_zip.output_path}"
  function_name = "pr-handler"
  role = "${aws_iam_role.test_app_lambda_role.arn}"
  handler = "pr-handler.handler"
  source_code_hash = "${data.archive_file.get_zip.output_base64sha256}"
  memory_size = 256
  timeout = 300
  runtime = "nodejs8.10"
}

resource "aws_lambda_permission" "test_app_lambda_permission_get" {
  statement_id = "AllowExecutionFromAPIGateway"
  action = "lambda:InvokeFunction"
  function_name = "${aws_lambda_function.test_app_get.arn}"
  principal = "apigateway.amazonaws.com"

  source_arn = "${aws_api_gateway_rest_api.test_app_gateway.execution_arn}/*/*/objects"
}

resource "aws_api_gateway_integration" "test_app_get_integration" {
  rest_api_id = "${aws_api_gateway_rest_api.test_app_gateway.id}"
  resource_id = "${aws_api_gateway_resource.objects_resource.id}"
  http_method = "${aws_api_gateway_method.objects_get.http_method}"
  integration_http_method = "GET"
  type = "AWS_PROXY"
  uri = "${aws_lambda_function.test_app_get.invoke_arn}"
}
