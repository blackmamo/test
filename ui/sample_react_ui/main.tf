resource "aws_s3_bucket" "front_end" {
  bucket = "${var.app_name}-s3-${terraform.workspace}"
  // TODO don't really want a public website I guess
  acl    = "public-read"
  policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": [
        "s3:GetObject"
    ],
      "Resource": [
      "arn:aws:s3:::${var.app_name}-s3-${terraform.workspace}/*"
    ]
    }
  ]
}
EOF

  website {
    index_document = "index.html"
  }
  versioning {
    enabled = true
  }
  tags = {
    workspace = "${terraform.workspace}"
    appname = "${var.app_name}"
  }
}

resource "aws_s3_bucket_object" "index" {
  bucket = "${aws_s3_bucket.front_end.id}"
  key    = "index.html"
  source = "./ui/sample_react_ui/dist/index.html"
  content_type = "text/html"
  etag   = "${md5(file("./ui/sample_react_ui/dist/index.html"))}"

  tags = {
    workspace = "${terraform.workspace}"
    appname = "${var.app_name}"
  }
}

resource "aws_s3_bucket_object" "app" {
  bucket = "${aws_s3_bucket.front_end.id}"
  key    = "index.js"
  source = "./ui/sample_react_ui/dist/index.js"
  content_type = "application/javascript"
  etag   = "${md5(file("./ui/sample_react_ui/dist/index.js"))}"

  tags = {
    workspace = "${terraform.workspace}"
    appname = "${var.app_name}"
  }
}