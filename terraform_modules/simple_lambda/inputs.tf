variable "lambda_source_file" {
  type = "string"
}

variable "lambda_source_dir" {
  type = "string"
}

variable "http_method" {
  type = "string"
}

variable "lambda_role_arn" {
  type = "string"
}

variable "api_gateway_id" {
  type = "string"
}

variable "api_gateway_execution_arn" {
  type = "string"
}

variable "api_gateway_resource_id" {
  type = "string"
}

variable "api_gateway_resource_path" {
  type = "string"
}

variable "lambda_env_vars" {
  type = "map"
}

variable "manage_iam" {
  type = "string"
}

variable "request_parameters" {
  type = "map"
}