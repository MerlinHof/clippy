import * as Security from "./security.js";
import Dialog from "./Dialog.js";
import * as GeneralFunctions from "./general.js";
import DOM from "./dom.js";

// Loads the Ai Summary
export async function showSummary(clip) {
   const progressDialog = new Dialog("loading");
   progressDialog.title = "Generating...";
   progressDialog.show();
   const answer = await callLLM("summary", `${clip.title}: ${clip.text}`, "");
   progressDialog.close();
   if (!answer) {
      GeneralFunctions.showAiLimitDialog();
      return;
   }
   const answerDialog = new Dialog();
   answerDialog.withSelectButton = false;
   answerDialog.imagePath = "/assets/images/magic.png";
   answerDialog.title = "Ai Summary";
   answerDialog.content = answer;
   answerDialog.isAiFeatureDialog = true;
   answerDialog.show();
}

// Loads and parses the Ai Fact Check
export async function showFactCheck(clip, visually = true) {
   const progressDialog = new Dialog("loading");
   progressDialog.title = "Generating...";
   if (visually) progressDialog.show();
   let answer = await callLLM("factcheck", `${clip.title}: ${clip.text}`, "");
   progressDialog.close();
   if (!answer) {
      if (visually) GeneralFunctions.showAiLimitDialog();
      return;
   }
   const obj = AiDataNotation.parse(answer);
   const score = Math.round(parseFloat(obj[0]["C"], 10));
   const analysis = obj[0]["A"];

   const answerDialog = new Dialog();
   answerDialog.withSelectButton = false;
   answerDialog.imagePath = "/assets/images/magic.png";
   answerDialog.title = "Ai Fact Check";
   answerDialog.isAiFeatureDialog = true;
   answerDialog.content = DOM.create("div")
      .append(DOM.create("div #credibilityScore").setText(`Credibility of ${score}%`))
      .append(DOM.create("br"))
      .append(DOM.create("t").setText(analysis))
      .getFirstElement();

   if (visually) {
      answerDialog.show();
      let red, green, blue, emoji;
      if (score < 50) {
         red = 255;
         green = 0;
         blue = 100;
         emoji = "😵‍💫";
      } else if (score < 80) {
         red = 255;
         green = 174;
         blue = 66;
         emoji = "🫤";
      } else {
         red = 0;
         green = 190;
         blue = 100;
         emoji = "👌";
      }

      DOM.select("credibilityScore").setStyle({
         backgroundColor: `rgb(${red}, ${green}, ${blue})`,
      });
      DOM.select("credibilityScore").appendText(" " + emoji);
   }

   if (score <= 50) {
      DOM.select("credibilityWarningText").setText(analysis);
      DOM.select("credibilityWarningContainer").setStyle({ display: "block" });
   }
}

// Handles the User Questions
export async function showQuestion(clip) {
   const inputDialog = new Dialog();
   inputDialog.title = "Type In Your Question";
   let content = DOM.create("div").append("Type in your Question about the Clip and hit the Button").append(DOM.create("div #aiQuestionInput [contentEditable=true]"));
   inputDialog.content = content.getFirstElement();
   inputDialog.selectButtonText = "Get Answer";
   inputDialog.show();
   inputDialog.selectButtonClicked = () => {
      const question = DOM.select("aiQuestionInput").getText().trim();
      if (question.length < 2) return;
      const progressDialog = new Dialog("loading");
      progressDialog.title = "Generating...";
      progressDialog.show();
      const suffix = `\n<END OF TEXT>\n\nIMPORTANT SYSTEM MESSAGE: The following is the said question about the above text to which I will respond directly and naturally: "${question}"`;
      callLLM("question", `${clip.title}: ${clip.text}`, suffix).then((res) => {
         progressDialog.close();
         if (!res) {
            GeneralFunctions.showAiLimitDialog();
            return;
         }
         const obj = AiDataNotation.parse(res);
         const emojis = obj[0]["E"] || "";
         const betterQuestion = obj[0]["Q"] || "";
         const answer = obj[0]["A"] || "";

         const answerDialog = new Dialog();
         answerDialog.withSelectButton = false;
         answerDialog.title = `${betterQuestion} ${emojis}`;
         answerDialog.content = answer;
         answerDialog.isAiFeatureDialog = true;
         answerDialog.show();

         const cookieName = `questions_${clip.id}`;
         const questions = JSON.parse(localStorage.getItem(cookieName) || "[]");
         if (!questions.some((q) => q.question == question)) {
            questions.push({
               Q: betterQuestion,
               A: answer,
               E: emojis,
            });
            localStorage.setItem(cookieName, JSON.stringify(questions));
            generateFaq(clip);
         }
      });
   };
}

export async function clearQuestions(clip) {
   const cookieName = `questions_${clip.id}`;
   localStorage.setItem(cookieName, "[]");
   GeneralFunctions.showSuccessDialog("Cleared Successfully");
   setTimeout(() => {
      generateFaq(clip);
   }, 300);
}

// Loads and parses the Ai FAQ
export async function generateFaq(clip) {
   let answer = await callLLM("faq", `${clip.title}: ${clip.text}`, "");
   if (!answer) {
      DOM.select("aiFaqElementContainer").setText("Limit reached, try again tomorrow");
      return;
   }

   let faq = AiDataNotation.parse(answer);
   const questions = JSON.parse(localStorage.getItem(`questions_${clip.id}`) || "[]");
   questions.forEach((question) => {
      faq.push(question);
   });

   DOM.select("aiFaqQuestionButton").setStyle({ display: "inline-flex" });
   DOM.select("aiFaqQuestionClearButton").setStyle({
      display: questions.length > 0 ? "inline-flex" : "none",
   });

   let container = DOM.select("aiFaqElementContainer").setContent("");
   for (let i = 0; i < faq.length; i++) {
      const faqElement = faq[i];
      const faqDiv = DOM.create("div .aiFaqElement");
      faqDiv.append(DOM.create("t .aiFaqElementEmojis").setText(faqElement["E"] || ""));
      faqDiv.append(DOM.create("t .aiFaqElementQuestion").setText(faqElement["Q"] || ""));
      faqDiv.append(DOM.create("t .aiFaqElementAnswer").setText(faqElement["A"] || ""));
      container.append(faqDiv);
   }
}

// Calls the Backend which makes the actual API Call to OpenAi / Anthropic
async function callLLM(action, message, suffix) {
   const language = navigator.language || navigator.userLanguage;
   const cookieName = `aicache_${await Security.hash(action + language + message + suffix)}`;
   const cachedData = localStorage.getItem(cookieName);
   if (cachedData?.length > 10) {
      return cachedData;
   }

   const res = await fetch("/apis/aiController.php", {
      method: "POST",
      body: JSON.stringify({
         action: action,
         message: message,
         suffix: suffix,
         language: language,
         csrf_token: csrf_token,
         service: "notopenai",
      }),
   }).catch((error) => {
      console.log(error);
      GeneralFunctions.showErrorDialog();
   });
   let data = [];
   if (res.ok) {
      data = await res.json();
   } else {
      GeneralFunctions.showErrorDialog();
      return;
   }
   if (data.error) return false;
   localStorage.setItem(cookieName, data.answer);
   return data.answer;
}

class AiDataNotation {
   static parse(str) {
      let obj = [{}];
      str = str.replaceAll("]:", "]");
      const parts = str.split(/\[(.+?)\]/);
      for (let i = 1; i < parts.length; i += 2) {
         const marker = parts[i].trim();
         const value = parts[i + 1].trim();

         if (obj[obj.length - 1].hasOwnProperty(marker)) {
            obj.push({});
         }
         obj[obj.length - 1][marker] = value;
      }
      console.log(obj);
      return obj;
   }
}
