<?php
// Deliver Image

/* Analyze URL and handle both formats /postimg/?id=1234 and /postimg/1234 */
if (isset($_GET["id"])) {
   $imageId = filter_input(INPUT_GET, "id", FILTER_SANITIZE_NUMBER_INT);
} elseif (preg_match('#^/postimg/(\d+)$#', $_SERVER["REQUEST_URI"], $matches)) {
   $imageId = filter_var($matches[1], FILTER_SANITIZE_NUMBER_INT);
}

if (isset($imageId)) {
   $imageFile = $_SERVER["DOCUMENT_ROOT"] . "/userdata/images/" . $imageId;

   if (!file_exists($imageFile)) {
      $imageFile = $_SERVER["DOCUMENT_ROOT"] . "/assets/images/notfound.jpg";
   }

   $finfo = new finfo(FILEINFO_MIME_TYPE);
   $mimeType = $finfo->file($imageFile);
   header("Content-Type: " . $mimeType);
   header("Cache-Control: public, max-age=31536000"); // 1 Jahr
   readfile($imageFile);
   die();
}

// CSRF Token
require_once $_SERVER["DOCUMENT_ROOT"] . "/utils/shared.php";
createCSRF();
?>



<html lang="en">
   <head>
      <base href="/postimg/" />
      <link rel="stylesheet" href="style.css" />
      <script type="module" defer="defer" src="script.js"></script>
      <title>Clippy - Image To URL</title>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0" />
      <meta name="author" content="Merlin Hof" />
      <meta name="copyright" content="Merlin Hof" />
      <meta name="robots" content="index" />
      <meta name="page-topic" content="Dienstleistung" />
      <meta http-equiv="content-language" content="en" />
   </head>

   <body>
      <div id="mainContainer">
         <t class="title">Clippy Image To URL</t>
         <t class="text">Select an image to seamlessly integrate it into your Markdown documents. Images that remain unaccessed for two years will be automatically removed.</t>
         <div class="button" id="uploadButton">
            <img src="/assets/images/add.png" class="buttonImage" />
            Upload
         </div>
      </div>
   </body>
</html>
