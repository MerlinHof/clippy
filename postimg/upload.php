<?php
require_once $_SERVER["DOCUMENT_ROOT"] . "/utils/shared.php";

// Variables
$dailyUploadLimit = 60;

// Check CSRF-Token
if (!checkCSRF($_POST["csrf_token"])) {
   echo json_encode(["error" => true]);
   accesslog("postimg", "failedCSRF");
   die();
}

// Log and Limit total number of Uploads
$count = accesslog("postimg", "upload", false);
if ($count >= $dailyUploadLimit) {
   echo json_encode(["error" => "limit"]);
   die();
}

// Check if file is a real image file
if (isset($_FILES["image"]) && $_FILES["image"]["error"] == UPLOAD_ERR_OK) {
   $checkImage = getimagesize($_FILES["image"]["tmp_name"]);
   if ($checkImage === false) {
      echo json_encode(["error" => true]);
      die();
   }
} else {
   echo json_encode(["error" => true]);
   die();
}

// Check MIME Type if its a valid file
$finfo = new finfo(FILEINFO_MIME_TYPE);
$mime = $finfo->file($_FILES["image"]["tmp_name"]);
$allowedMimeTypes = [
   "image/jpeg",
   "image/png",
   "image/gif",
   "image/webp",
   "image/avif",
   "image/svg",
   "image/heic",
   "image/heif",
   "image/tiff",
   "image/bmp",
   "image/vnd.microsoft.icon",
];
if (!in_array($mime, $allowedMimeTypes)) {
   accesslog("postimg", "failedMimeType");
   echo json_encode(["error" => true]);
   die();
}

// Check if image size is below 8 MB
$imageSize = $_FILES["image"]["size"];
$maxSize = 8 * 1024 * 1024;
if ($imageSize > $maxSize) {
   echo json_encode(["error" => true]);
   accesslog("postimg", "failedTooLarge");
   die();
}

// Actual Upload
$basePath = $_SERVER["DOCUMENT_ROOT"] . "/userdata/images/";
if (!is_dir($basePath)) {
   mkdir($basePath, 0755, true);
}
do {
   $id = (string) mt_rand(100000000000, 999999999999);
   $targetFile = $basePath . $id;
} while (file_exists($targetFile));
if (move_uploaded_file($_FILES["image"]["tmp_name"], $targetFile)) {
   touch($targetFile); // Make sure fileatime is updated
   accesslog("postimg", "upload");
   echo json_encode(["id" => $id]);
} else {
   echo json_encode(["error" => true]);
}

// Clean Up by deleting old unused images
if (mt_rand(1, 10) === 1) {
   $files = glob($_SERVER["DOCUMENT_ROOT"] . "/userdata/images/*");
   $numberOfFilesToCheck = 25;
   $fileCount = count($files);
   if ($fileCount == 0) {
      return;
   }
   for ($i = 0; $i < $numberOfFilesToCheck; $i++) {
      $randomIndex = mt_rand(0, $fileCount - 1);
      $file = $files[$randomIndex];
      if (!file_exists($file)) {
         continue;
      }

      // Delete file if not accessed in over 24 months
      $timeDifference = time() - fileatime($file);
      if ($timeDifference > 24 * (30 * 24 * 60 * 60)) {
         accesslog("postimg", "cleanUp");
         unlink($file);
      }
   }
}
?>
