# dynamo db table for the objects

resource "aws_dynamodb_table" "db" {
  name           = "${var.app_name}-db-${terraform.workspace}"
  billing_mode   = "PROVISIONED"
  read_capacity  = 20
  write_capacity = 20
  hash_key       = "id"

  attribute {
    name = "id"
    type = "S"
  }

  tags = {
    workspace = "${terraform.workspace}"
    appname = "${var.app_name}"
  }
}

# IAM stuff for lambdas

resource "aws_iam_policy" "lambda_policy" {
  name = "sl-${var.app_name}-lambda-policy-${terraform.workspace}"
  count = "${var.manage_iam}"
  path = "/"
  description = "test app lambda policy"
  policy = <<EOF
{
    "Version": "2012-10-17",
    "Statement": [
        {
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
                "dynamodb:*"
            ],
            "Resource": [
                "${aws_dynamodb_table.db.arn}"
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

resource "aws_iam_role_policy_attachment" "lambda-attach" {
  count = "${var.manage_iam}"
  role = "${var.lambda_role_name}"
  policy_arn = "${aws_iam_policy.lambda_policy.arn}"
}

# REST resources

resource "aws_api_gateway_resource" "objects_resource" {
  rest_api_id = "${var.api_gateway_id}"
  parent_id = "${var.api_gateway_execution_root_resource}"
  path_part = "objects"
}

resource "aws_api_gateway_resource" "object_resource" {
  rest_api_id = "${var.api_gateway_id}"
  parent_id = "${aws_api_gateway_resource.objects_resource.id}"
  path_part = "{objectId}"
}

# REST methods

module "get_lambda" {
  source = "../../terraform_modules/simple_lambda"
  lambda_source_file = "get.js"
  lambda_source_dir = "./lambda/objects_api/dist/"
  http_method = "GET"
  lambda_role_arn = "${var.lambda_role_arn}"
  api_gateway_id = "${var.api_gateway_id}"
  api_gateway_execution_arn = "${var.api_gateway_execution_arn}"
  api_gateway_resource_id = "${aws_api_gateway_resource.object_resource.id}"
  api_gateway_resource_path = "${aws_api_gateway_resource.object_resource.path}"
  request_parameters = {
    "method.request.path.objectId" = true
  }
  lambda_env_vars = {
    DYNAMO_TABLE = "${aws_dynamodb_table.db.name}"
  }
  # Hack to allow us to not create iam resources with localstack
  # see https://github.com/hashicorp/terraform/issues/15281
  manage_iam = "${var.manage_iam}"
}

module "delete_lambda" {
  source = "../../terraform_modules/simple_lambda"
  lambda_source_file = "delete.js"
  lambda_source_dir = "./lambda/objects_api/dist/"
  http_method = "DELETE"
  lambda_role_arn = "${var.lambda_role_arn}"
  api_gateway_id = "${var.api_gateway_id}"
  api_gateway_execution_arn = "${var.api_gateway_execution_arn}"
  api_gateway_resource_id = "${aws_api_gateway_resource.object_resource.id}"
  api_gateway_resource_path = "${aws_api_gateway_resource.object_resource.path}"
  request_parameters = {
    "method.request.path.objectId" = true
  }
  lambda_env_vars = {
    DYNAMO_TABLE = "${aws_dynamodb_table.db.name}"
  }
  # Hack to allow us to not create iam resources with localstack
  # see https://github.com/hashicorp/terraform/issues/15281
  manage_iam = "${var.manage_iam}"
}

module "upsert_lambda" {
  source = "../../terraform_modules/simple_lambda"
  lambda_source_file = "upsert.js"
  lambda_source_dir = "./lambda/objects_api/dist/"
  http_method = "POST"
  lambda_role_arn = "${var.lambda_role_arn}"
  api_gateway_id = "${var.api_gateway_id}"
  api_gateway_execution_arn = "${var.api_gateway_execution_arn}"
  api_gateway_resource_id = "${aws_api_gateway_resource.objects_resource.id}"
  api_gateway_resource_path = "${aws_api_gateway_resource.objects_resource.path}"
  request_parameters = {}
  lambda_env_vars = {
    DYNAMO_TABLE = "${aws_dynamodb_table.db.name}"
  }
  # Hack to allow us to not create iam resources with localstack
  # see https://github.com/hashicorp/terraform/issues/15281
  manage_iam = "${var.manage_iam}"
}