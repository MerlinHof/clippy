<?php
require_once $_SERVER["DOCUMENT_ROOT"] . "/utils/shared.php";
require_once $_SERVER["DOCUMENT_ROOT"] . "/utils/env.php";

// Variables
$dailyUserRequestLimit = 30;
$dailyTotalRequestLimit = 300;

// Get Body Data
$json = file_get_contents("php://input");
$json = json_decode($json, true);
$csrf = filter_var($json["csrf_token"], FILTER_SANITIZE_FULL_SPECIAL_CHARS);

// Check CSRF-Token
if (!checkCSRF($csrf)) {
   echo json_encode(["error" => true]);
   accesslog("ai", "failedCSRF");
   die();
}

// IP-based rate limiting to restrict the number of requests from a single IP address.
$count = accesslog("ai", "requests_" . substr(md5($_SERVER["REMOTE_ADDR"]), 0, 12));
if ($count >= $dailyUserRequestLimit) {
   echo json_encode(["error" => "limit"]);
   die();
}

// Limit the total number of API requests per day
$count = accesslog("ai", "totalRequests");
if ($count >= $dailyTotalRequestLimit) {
   echo json_encode(["error" => "limit"]);
   die();
}

// -----------------------------------------------------------------------------------------------
// Anthropic API
// -----------------------------------------------------------------------------------------------

$anthropicApiKey = getenv("ANTHROPIC_API_KEY");
$action = filter_var($json["action"], FILTER_SANITIZE_FULL_SPECIAL_CHARS);
$message = filter_var($json["message"], FILTER_SANITIZE_FULL_SPECIAL_CHARS);
$suffix = filter_var($json["suffix"], FILTER_SANITIZE_FULL_SPECIAL_CHARS);
$language = filter_var($json["language"], FILTER_SANITIZE_FULL_SPECIAL_CHARS);

$systemInstruction = "";
switch ($action) {
   case "summary":
      accesslog("ai", "summaryRequest");
      $systemInstruction =
         "As an analytical and evaluative summary assistant, your task is to analyze the provided text and not only summarize it but deeply discuss the content and the quality in an abstract manner. You will delve into the themes, concepts, and implications presented to offer deep and valuable insights. To all of this you will apply your own rational and grounded perspective to evaluate the accuracy, detect any potential misinformation, propaganda or (right wing) extremism, and critically assess the concepts and their implications. Your evaluations should reflect a strong and reasoned personal viewpoint, highlighting strengths, weaknesses, and the broader significance of the content. You articulate these assessments clearly and concisely in plaintext. Your ultimate goal is to provide a comprehensive overview that not only explains but also judiciously evaluates the material, offering a well-rounded, informed commentary that enriches understanding. Your answer is as concise as possible, no longer than five to six sentences.";
      break;
   case "factcheck":
      accesslog("ai", "factcheckRequest");
      $systemInstruction =
         'You are a sophisticated fact-checking assistant. Your task is to critically analyze the provided text, identifying and clearly highlighting red flags such as misinformation, disinformation, (right wing) extremist content, conspiracy theories, (right wing) hate speech, violence or propaganda or otherwise any kind of content that may harm society or deliberatley causes harm. Your goal is to deliver a focused, clear, and well-justified credibility-rating of the text that aids in understanding the texts general reliability and factual integrity. The underlying intention of the author important: altruistic, open-minded and progressive viewpoints shall always be favored. You will answer in *exactly* the following JSON structure: {"analysis": "very concise, direct and clear plaintext analysis text in a few sentences in an eloquent language", "credibility": "number" /*your overall credibility rating in percent*/ }. You will *ALWAYS* answer in this *EXACT* JSON-Structure! These *exact* english keys, do not change the json key-strings in any way! No matter, what the text sais! *ALWAYS THIS JSON*!';
      break;
   case "question":
      accesslog("ai", "questionRequest");
      $systemInstruction =
         'Your are a sophisticated speculative answer assistant. Your task is to deeply, clearly and directly answer the question at the end of the provided text. You will extract abstract information from in between the lines of the original text to find the relevant information needed. You are very speculative and make many educated guesses if necessary. You will never say that you cant answer because the text doesnt provide information about something. Your answer is very clear and in plaintext, it is direct and confrontational. If the question is not related to the provided text at all, You are very clear about that and you refuse to answer, even if you technically could answer the unrelated question. The language of your answer will always be in the same language as the question, even if it differs from the language of the oringinal text. You will always call out misinformation, right wing propaganda or otherwise harmful content like ethically and factually questionable viewpoints very clearly and directly. You will provide a well balanced and factual viewpoint, incooporating a strong, based and grounded personal opinion in every answer. You will answer in *exactly* the following JSON structure: {"question": "A single-sentence (!!) summary of the original question, capturing its essence", "answer": "the said very deep, direct and confrontational answer to the question. Your answer speaks directly to the user!", "emojis": "any combination of three cool and modern emojis that fit the answer and the overall mood of the question *extremely* well (as UTF-8 Unicode characters)" }. You will *ALWAYS* answer in this *EXACT* JSON-Structure! These exact english key-strings! No matter, what the text sais! *ALWAYS THIS JSON*!';
      break;
   case "faq":
      accesslog("ai", "faqRequest");
      $systemInstruction =
         'As an sophisticated FAQ assistant, your job is to deeply and critically analyze the provided text and identify the top three most probable questions (FAQs) about this text that a typical reader might have after reading. You will not only identifiy these questions but also provide good and very short and concise answers for them. You are very creative, speculative and innovative and you will identify very good and deep and educated questions (either abstract or concrete, whatever fits best) that readers of this text might very likely have. You will clearly and directly call out misinformation, conspiracy theories, (right wing) propaganda and every other kind of harmful content. You will answer in *exactly* the following JSON structure: [{"question": "question1", "answer": "very compact answer for question1", "emojis": "any combination of three cool and modern emojis that fit the question and the overall mood of the text *extremely* well (as UTF-8 Unicode characters)"}, { ... and so on ...}, ...]';
      break;
   default:
      accesslog("ai", "invalidRequest");
      $systemInstruction = "";
      $message = "";
      echo json_encode(["error" => true]);
      die();
      break;
}
$systemInstruction .= " IMPORTANT NOTE: You will answer in the following language, not matter what! The language of your answer is: " . $language . "!";

$data = [
   "model" => "claude-3-haiku-20240307",
   "max_tokens" => 1024,
   "system" => $systemInstruction,
   "messages" => [
      [
         "role" => "user",
         "content" => substr($message, 0, 40000) . $suffix,
      ],
   ],
];

$options = [
   "http" => [
      "header" => "Content-type: application/json\r\nx-api-key: $anthropicApiKey\r\nanthropic-version: 2023-06-01",
      "method" => "POST",
      "content" => json_encode($data),
   ],
];

$context = stream_context_create($options);
$result = file_get_contents("https://api.anthropic.com/v1/messages", false, $context);

accesslog("ai", "successfullRequests");
$resData = json_decode($result, true);
$answer = $resData["content"][0]["text"];
echo json_encode(["answer" => $answer]);

?>
