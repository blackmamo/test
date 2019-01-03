data "archive_file" "get_zip" {
  type = "zip"
  source_file = "dist/${var.lambda_source_file}"
  output_path = "dist/${replace(var.lambda_source_file, ".js", ".zip")}"
}

resource "aws_lambda_function" "test_app_lambda" {
  filename = "${data.archive_file.get_zip.output_path}"
  function_name = "object-${replace(var.lambda_source_file, ".js", "")}-${terraform.workspace}"
  role = "${var.lambda_role_arn}"
  handler = "${replace(var.lambda_source_file, ".js", "")}.handler"
  source_code_hash = "${data.archive_file.get_zip.output_base64sha256}"
  memory_size = 256
  timeout = 300
  runtime = "nodejs8.10"
  environment {
    variables = "${var.lambda_env_vars}"
  }
}

resource "aws_lambda_permission" "test_app_lambda_permission" {
  count = "${var.manage_iam}"
  statement_id = "AllowExecutionFromAPIGateway"
  action = "lambda:InvokeFunction"
  function_name = "${aws_lambda_function.test_app_lambda.arn}"
  principal = "apigateway.amazonaws.com"

  source_arn = "${var.api_gateway_execution_arn}/*/${var.http_method}/objects"
}

resource "aws_api_gateway_method" "objects_method" {
  rest_api_id = "${var.api_gateway_id}"
  resource_id = "${var.api_gateway_resource_id}"
  http_method = "${var.http_method}"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "test_app_get_integration" {
  rest_api_id = "${var.api_gateway_id}"
  resource_id = "${var.api_gateway_resource_id}"
  http_method = "${aws_api_gateway_method.objects_method.http_method}"
  integration_http_method = "POST"
  type = "AWS_PROXY"
  uri = "${aws_lambda_function.test_app_lambda.invoke_arn}"
}