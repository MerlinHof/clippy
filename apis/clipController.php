<?php
require_once $_SERVER["DOCUMENT_ROOT"] . "/utils/shared.php";

// Variables
$dailyUploadLimit = 500;

$json = file_get_contents("php://input");
$json = json_decode($json, true);
$csrf = filter_var($json["csrf_token"], FILTER_SANITIZE_FULL_SPECIAL_CHARS);

// Check CSRF_Token
if (!checkCSRF($csrf)) {
   echo json_encode(["error" => true]);
   accesslog("clips", "failedCSRF");
   die();
}

// Get Action Type
$action = filter_var($json["action"], FILTER_SANITIZE_FULL_SPECIAL_CHARS);

// Read Clip
if ($action == "read") {
   $id = filter_var($json["id"], FILTER_SANITIZE_FULL_SPECIAL_CHARS);
   $file = $_SERVER["DOCUMENT_ROOT"] . "/userdata/clips/" . $id;
   if (!file_exists($file)) {
      accesslog("clips", "readUnknownFile");
      echo json_encode(["error" => true]);
      die();
   }
   $fileContent = file_get_contents($file);
   $obj = json_decode($fileContent);
   accesslog("clips", "read");
   echo json_encode(["body" => $obj->body]);
}

// Upload (Create or Update) Clip
if ($action == "upload") {
   $basePath = $_SERVER["DOCUMENT_ROOT"] . "/userdata/clips/";
   if (!is_dir($basePath)) {
      mkdir($basePath, 0755, true);
   }
   $id = filter_var($json["id"], FILTER_SANITIZE_FULL_SPECIAL_CHARS);
   $file = $basePath . $id;
   if (file_exists($file) && strlen($id) > 4) {
      if (!isValidPanelKey()) {
         echo json_encode(["error" => true]);
         die();
      }
      accesslog("clips", "update");
   } else {
      $count = accesslog("clips", "upload", false);
      if ($count >= $dailyUploadLimit) {
         echo json_encode(["error" => "limit"]);
         die();
      }
      accesslog("clips", "upload");
      do {
         $id = randomString();
         $file = $_SERVER["DOCUMENT_ROOT"] . "/userdata/clips/" . $id;
      } while (file_exists($file));
   }

   $body = filter_var($json["body"], FILTER_SANITIZE_FULL_SPECIAL_CHARS);
   $hashedPanelKey = filter_var($json["hashedPanelKey"], FILTER_SANITIZE_FULL_SPECIAL_CHARS);
   $content = json_encode(["body" => $body, "hashedPanelKey" => $hashedPanelKey]);
   file_put_contents($file, $content);
   echo json_encode(["id" => $id]);
}

// Delete Clip
if ($action == "delete") {
   $id = filter_var($json["id"], FILTER_SANITIZE_FULL_SPECIAL_CHARS);
   $file = $_SERVER["DOCUMENT_ROOT"] . "/userdata/clips/" . $id;
   if (!isValidPanelKey()) {
      accesslog("clips", "unauthorizedDelete");
      echo json_encode(["success" => false]);
      die();
   }
   if (file_exists($file)) {
      unlink($file);
      accesslog("clips", "delete");
      echo json_encode(["success" => true]);
   } else {
      echo json_encode(["success" => false]);
   }
}

// Check Panel Key
if ($action == "checkpanelkey") {
   if (isValidPanelKey()) {
      echo json_encode(["success" => true]);
   } else {
      echo json_encode(["success" => false]);
   }
}

// Clean Up by deleting Clips which weren't accessed in a very long time
if (mt_rand(1, 10) === 1) {
   $files = glob($_SERVER["DOCUMENT_ROOT"] . "/userdata/clips/*");
   $numberOfFilesToCheck = 10;
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
         accesslog("clips", "cleanUp");
         unlink($file);
      }
   }
}

function randomString()
{
   return bin2hex(random_bytes(6));
}

// Checks if the passed key is valid
function isValidPanelKey()
{
   global $json;
   $id = filter_var($json["id"], FILTER_SANITIZE_FULL_SPECIAL_CHARS);
   $passedSecret = filter_var($json["panelKey"], FILTER_SANITIZE_FULL_SPECIAL_CHARS);
   if (!preg_match('/^[a-zA-Z0-9]+$/', $id) || empty($passedSecret)) {
      return false;
   }
   $file = $_SERVER["DOCUMENT_ROOT"] . "/userdata/clips/" . $id;
   if (!file_exists($file)) {
      return false;
   }
   $content = file_get_contents($file);
   $obj = json_decode($content);
   if (json_last_error() !== JSON_ERROR_NONE || !isset($obj->hashedPanelKey)) {
      return false;
   }

   $hashedRealSecret = $obj->hashedPanelKey;
   $hashedPassedSecret = hash("sha256", "clippy" . $passedSecret);

   if (hash_equals($hashedRealSecret, $hashedPassedSecret)) {
      return true;
   }
   return false;
}
