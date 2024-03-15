<?php
require_once "utils/shared.php";
createCSRF();
?>



<html lang="en">

<head>
   <script type="module" src="/scripts/main.js?v=43" defer="defer"></script>
   <script type="text/javascript" src="/scripts/libs/marked.min.js"></script>
   <script type="text/javascript" src="/scripts/libs/highlight.min.js"></script>
   <link rel="stylesheet" href="/styles/index.css?v=43">
   <link rel="icon" href="assets/images/logo.png">
   <title>Clippy - Your Markdown Document Sharing Platform</title>
   <meta charset="utf-8" />
   <meta name="viewport" content='width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0'>
   <meta name="description" content="Save and share Markdown documents with others! No ads, no data collection, no login and completely free! Perfect for blogs, books, guides, and more. Enjoy a beautiful reading experience." />
   <meta name="keywords" content="markdown sharing, markdown storage, blog sharing platform, online book platform, markdown guide, markdown blog platform, design-centric document sharing, user-friendly markdown editor, design reading experience, Clipboard, Pasteboard, Paste, online clipboard, online saver, text saver, save text, share text, text sharer, share, reading, paster, text paster, paste text" />
   <meta name="author" content="Merlin Hof" />
   <meta name="copyright" content="Merlin Hof" />
   <meta name="robots" content="index" />
   <meta name="page-topic" content="Dienstleistung">
   <meta http-equiv="content-language" content="en">
   <meta name="google-site-verification" content="0oGW64ZnI-4LG-mHq3qiAOLtovVFecOlBXKR0YlQQIg" />
</head>

<body>
   <!-- Loading View Container -->
   <div id="loadingContainer">
      <img src="/assets/images/loading.png" class="loadingImage">
   </div>

   <!-- Main Page -->
   <div id="mainContainer">
      <div id="textareatitleScrollContainer">
         <input class="textarea" id="textareatitle" type="text" placeholder="Title" />
      </div>
      <textarea class="textarea" id="textareatext"></textarea>

      <div id="buttonContainer">
         <button class="button" id="saveButton" type="button">
            <img class="buttonImage" src="assets/images/tick.png">
            Upload
         </button>
         <button class="button" id="deleteButton" type="button">
            <img class="buttonImage" src="/assets/images/delete.png">
            Delete
         </button>
      </div>

      <div id="hintContainer">
         <img src="/assets/images/markdown.png" id="hintImage">
         <t id="hintText">Clippy Supports Markdown</t>
         <div class="smallButton" onclick="window.location.href='https://www.clippy.cc/?id=db6c36765cf1#f5i0437hf4emplt'" target="_blank"><img class="buttonImage" src="/assets/images/info.png">Learn More</div>
      </div>
   </div>

   <!-- Viewer Page -->
   <div id="viewerContainer">
      <t id="viewerTitle"></t>

      <div id="aiButtonContainer">
         <div id="aiSummaryButton" class="smallButton">
            <img src="/assets/images/star.png" class="buttonImage">
            Ai Summary
         </div>
         <div id="aiFactCheckButton" class="smallButton">
            <img src="/assets/images/factcheck.png" class="buttonImage">
            Fact Check
         </div>
         <div id="aiQuestionButton" class="smallButton">
            <img src="/assets/images/question.png" class="buttonImage">
            Questions
         </div>
      </div>

      <!-- Credibility Warning Container -->
      <div id="credibilityWarningContainer">
         <div id="credibilityWarningHeader">
            <img src="/assets/images/warning.png">
            <t id="credibilityWarningTitle">Content Warning</t>
         </div>
         <t id="credibilityWarningText">Der Text verbreitet eine weitreichende Verschwörungstheorie, die ohne belastbare Beweise oder seriöse Quellen auskommt. Es werden falsche Behauptungen über 5G, Impfungen, Eliten wie Bill Gates und Angela Merkel sowie eine vermeintliche globale Verschwörung aufgestellt. Die Argumentation basiert auf Behauptungen und Unterstellungen, die auf Angst und Misstrauen abzielen.</t>
      </div>

      <t id="viewerText"></t>

      <div id="aiFaqContainer">
         <div id="aiFaqTitleContainer">
            <img src="/assets/images/magic.png" id="aiFaqIcon">
            <h1 id="aiFaqTitle">Ai Questions & Answers</h1>
         </div>
         <div id="aiFaqElementContainer">
            <img src="/assets/images/loading.png" class="loadingImage" style="width: 40px; height: 40px;" />
         </div>
         <div id="aiFaqQuestionButton" class="smallButton">
            <img src="/assets/images/add.png" class="buttonImage">
            Ask New Question
         </div>
          <div id="aiFaqQuestionClearButton" class="smallButton">
             <img src="/assets/images/trash2.png" class="buttonImage">
             Clear History
          </div>
      </div>
   </div>

</body>

</html>
