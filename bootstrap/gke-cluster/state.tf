resource "random_id" "bucket_prefix" {
  byte_length = 8
}

resource "google_storage_bucket" "state" {
  name          = "${random_id.bucket_prefix.hex}-bucket-tfstate"
  force_destroy = false
  location      = "NORTHAMERICA-NORTHEAST1"
  storage_class = "REGIONAL"

  uniform_bucket_level_access = true

  versioning {
    enabled = true
  }
}