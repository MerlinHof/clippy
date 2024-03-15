<?php
if (session_status() == PHP_SESSION_NONE) {
   session_start();
}

function createCSRF()
{
   $csrf_token = bin2hex(random_bytes(32));
   if (!isset($_SESSION["csrf_tokens"])) {
      $_SESSION["csrf_tokens"] = [];
   }
   $_SESSION["csrf_tokens"][] = $csrf_token;
   if (count($_SESSION["csrf_tokens"]) > 600) {
      array_shift($_SESSION["csrf_tokens"]);
   }
   echo "<script>let csrf_token = '" . $csrf_token . "'</script>";
}

function checkCSRF($postToken)
{
   if (empty($postToken) || !in_array($postToken, $_SESSION["csrf_tokens"])) {
      return false;
   }
   return true;
}

// Logs interesting data to a log file
function accesslog($folderName, $action, $write = true)
{
   $basePath = $_SERVER["DOCUMENT_ROOT"] . "/userdata/logs/" . $folderName . "/";
   if (!is_dir($basePath)) {
      mkdir($basePath, 0755, true);
   }
   $currentMonth = date("Y-m-d");
   $logFilePath = $basePath . $currentMonth . ".json";

   // Create the log file if it does not exist
   if (file_exists($logFilePath)) {
      $logContent = file_get_contents($logFilePath);
      $logData = json_decode($logContent, true);
   } else {
      $logData = [];
   }

   // Increment the log counter for the specified action
   if (isset($logData[$action])) {
      $logData[$action]++;
   } else {
      $logData[$action] = 1;
   }

   // Write the updated log data back to the file
   if ($write) {
      file_put_contents($logFilePath, json_encode($logData));
   }
   return $logData[$action];
}

?>
