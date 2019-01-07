output "website_endpoint" {
  value = "${aws_s3_bucket.front_end.website_endpoint}"
}