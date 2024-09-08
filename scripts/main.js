import Clip from "./Clip.js";
import * as Ai from "./ai.js";
import * as GeneralFunctions from "./general.js";
import Dialog from "./Dialog.js";
import DOM from "./dom.js";

// Global Variables
let clip = new Clip();
let scrollPosUpdateEnabled = false;

// Displays Hint and binds input event to hide it
setTimeout(() => {
   const textareatext = DOM.select("textareatext");
   const hintContainer = DOM.select("hintContainer").setStyle({
      left: Math.max(5, textareatext.getLeft() - 20) + "px",
      top: textareatext.getTop() + 80 + "px",
      opacity: 1,
      transform: "scale(1)",
   });

   let hidden = false;
   textareatext.onInput(() => {
      if (hidden) return;
      hintContainer.setStyle({
         opacity: 0,
         transform: "scale(0.9)",
      });
      setTimeout(() => {
         hintContainer.setStyle({ display: "none" });
      }, 300);
      hidden = true;
   });
}, 1000);

// Periodically saves scroll position if enabled
setInterval(() => {
   if (scrollPosUpdateEnabled) {
      const itemName = `scrollPos_${clip.id}`;
      localStorage.setItem(itemName, window.scrollY);
   }
}, 500);

// Parses URL parameters, Fetches Clip, and determines UI mode (viewer or control panel).
const urlParameters = Object.fromEntries(new URLSearchParams(window.location.search));
load(urlParameters);
async function load(urlParameters) {
   if (urlParameters.id?.length > 4) {
      DOM.select("loadingContainer").setStyle({ display: "block" });
      clip = new Clip(urlParameters.id, window.location.hash.substring(1).trim());
      let res = await clip.read();
      if (!res) {
         window.location.href = "/";
         return;
      }
      if (!urlParameters.panelkey) {
         showViewer();
         return;
      }
      const isValid = await clip.checkPanelKey(urlParameters.panelkey);
      clip.panelKey = urlParameters.panelkey;
      if (isValid) {
         showControlPanel();
      } else {
         showViewer();
      }
   } else {
      DOM.select("mainContainer").setStyle({ opacity: 1 });
   }
}

// Show Viewer UI
async function showViewer() {
   DOM.select("mainContainer").setStyle({ display: "none" });
   const viewerContainer = DOM.select("viewerContainer").setStyle({
      display: "block",
   });
   marked.use({ async: true });
   const parsedText = await marked.parse(clip.text);
   const sanitizedHtml = DOMPurify.sanitize(parsedText, { ADD_TAGS: ["iframe"], ADD_ATTR: ["allow", "allowfullscreen", "frameborder", "scrolling"] });

   document.title = clip.title;
   DOM.select("viewerTitle").setText(clip.title);
   DOM.select("viewerText").setContent(sanitizedHtml);

   hljs.highlightAll();
   modifyHtml();

   setTimeout(() => {
      DOM.select("loadingContainer").setStyle({ opacity: 0 });
      setTimeout(() => {
         DOM.select("loadingContainer").setStyle({ display: "none" });
      }, 300);
      viewerContainer.setStyle({ opacity: 1 });

      // Load Saved Scroll Position
      const itemName = `scrollPos_${clip.id}`;
      if (localStorage.getItem(itemName) == null) {
         window.scrollTo(0, 0);
      } else {
         window.scrollTo(0, localStorage.getItem(itemName));
      }
      scrollPosUpdateEnabled = true;
   }, 200);

   setTimeout(() => {
      Ai.generateFaq(clip);
      Ai.showFactCheck(clip, false);
   }, 500);
}

function modifyHtml() {
   // Intersection Observer für Lazy Loading von iframes initialisieren
   const observer = new IntersectionObserver(
      (entries, observer) => {
         entries.forEach((entry) => {
            if (entry.isIntersecting) {
               const target = entry.target;
               target.setAttribute("src", target.getAttribute("data-src"));
               target.removeAttribute("data-src");
               target.onload = () => {
                  target.style.opacity = "1";
                  target.style.backgroundColor = "transparent";
               };
               observer.unobserve(target);
            }
         });
      },
      { threshold: 0.1 },
   );

   // Alle iframes Lazy Loaden
   document.querySelectorAll("iframe").forEach((iframe) => {
      if (iframe.hasAttribute("src")) {
         iframe.setAttribute("data-src", iframe.getAttribute("src"));
         iframe.removeAttribute("src");
         observer.observe(iframe);
      }
      // Sandbox-Modus für Sicherheit setzen
      iframe.setAttribute("sandbox", "allow-scripts allow-same-origin");
   });

   // Image ALT to Caption
   DOM.select("#viewerText img").forEvery((image) => {
      const caption = DOM.create("figcaption").setText(image.alt);
      image.insertAdjacentElement("afterend", caption.getFirstElement());
   });

   // Open links in a NEW tab
   document.querySelectorAll("a").forEach((link) => {
      link.setAttribute("target", "_blank");
   });

   // Alle Anker-Links überschreiben, die auf das eigene Dokument verweisen
   document.querySelectorAll("a[href^='#']").forEach((link) => {
      link.addEventListener("click", function (e) {
         e.preventDefault();

         const targetText = decodeURI(link.getAttribute("href").substring(1).toLowerCase().trim());
         let targetElement = null;
         document.querySelectorAll("h1, h2, h3, h4, h5, h6").forEach(function (hTag) {
            const hText = hTag.textContent.toLowerCase().trim().replaceAll(" ", "-");
            if (targetElement === null && hText === targetText) {
               targetElement = hTag;
            }
         });

         // Wenn ein Ziel gefunden wurde, scrollt es dorthin
         if (targetElement) {
            const offset = -40;
            const y = targetElement.getBoundingClientRect().top + window.pageYOffset + offset;
            GeneralFunctions.smoothScrollTo(y, 1000);
         }
      });
   });

   // Insert Spacers before and after every hr element.
   document.querySelectorAll("hr").forEach((hr) => {
      const spacerBefore = DOM.create("div .hrSpacer");
      const spacerAfter = DOM.create("div .hrSpacer");
      hr.insertAdjacentElement("beforebegin", spacerBefore.getFirstElement());
      hr.insertAdjacentElement("afterend", spacerAfter.getFirstElement());
   });
}

// Show Control Panel UI
function showControlPanel() {
   DOM.select("hintContainer").setStyle({ display: "none" });
   DOM.select("saveButton").setContent("<img class='buttonImage' src='assets/images/tick.png'>Update");
   DOM.select("deleteButton").setStyle({ display: "block" });
   DOM.select("textareatitle").setValue(clip.title);
   DOM.select("textareatext").setValue(clip.text);
   DOM.select("mainContainer").setStyle({ opacity: 1 });
   DOM.select("loadingContainer").setStyle({ opacity: 0 });
   setTimeout(() => {
      DOM.select("loadingContainer").setStyle({ display: "none" });
   }, 500);

   // Adjusts the width of the title textarea to enable horizontal scrolling if needed
   const textareatitle = DOM.select("textareatitle");
   textareatitle.onInput(() => {
      textareatitle.setStyle({ width: textareatitle.getScrollWidth() + "px" });
   }, true);
}

// Click Listeners
DOM.select("aiSummaryButton").onClick(() => {
   Ai.showSummary(clip);
});
// DOM.select("aiFactCheckButton").onClick(() => {
//    Ai.showFactCheck(clip);
// });
// DOM.select("aiQuestionButton").onClick(() => {
//    const top = window.pageYOffset + DOM.select("aiFaqContainer").getTop();
//    GeneralFunctions.smoothScrollTo(top - 100, 800);
// });
DOM.select("aiFaqQuestionButton").onClick(() => {
   Ai.showQuestion(clip);
});
DOM.select("aiFaqQuestionClearButton").onClick(() => {
   Ai.clearQuestions(clip);
});
DOM.select("shareButton").onClick(() => {
   if (navigator.share) {
      navigator
         .share({
            title: document.title,
            text: "Ein interessanter Link",
            url: window.location.href,
         })
         .then(() => console.log("Erfolgreich geteilt!"))
         .catch((error) => console.error("Fehler beim Teilen:", error));
   } else {
      console.log("Web Share API wird nicht unterstützt.");
   }
});
DOM.select("editButton").onClick(() => {
   const inputDialog = new Dialog();
   inputDialog.title = "Secret Key";
   let content = DOM.create("div").append("Enter your secret key to access the panel.").append(DOM.create("div.input #panelKeyInput [contentEditable=true]"));
   inputDialog.content = content.getFirstElement();
   inputDialog.selectButtonText = "Go To Panel";
   inputDialog.show();
   inputDialog.selectButtonClicked = () => {
      const panelKey = DOM.select("panelKeyInput").getText().trim();
      if (panelKey.length < 2) return;

      const url = new URL(window.location.href);
      const baseUrl = url.origin;
      const hash = url.hash;
      const id = url.searchParams.get("id");
      const controlPanelUrl = `${baseUrl}/?id=${id}&panelkey=${panelKey}${hash}`;
      console.log(controlPanelUrl);
      window.open(controlPanelUrl, "_blank");
   };
});

// Upload Clip
DOM.select("saveButton").onClick(async () => {
   const progressDialog = new Dialog("loading");
   progressDialog.title = "Uploading...";
   progressDialog.show();

   clip.title = DOM.select("textareatitle").getValue();
   clip.text = DOM.select("textareatext").getValue();
   const res = await clip.upload();
   progressDialog.close();
   if (res !== true) {
      const errorDialog = new Dialog();
      errorDialog.imagePath = "/assets/images/warning.png";
      errorDialog.title = res == 0 ? "Incomplete Clip" : "Limit Reached";
      errorDialog.content = res == 0 ? "Please give your Clip a title and a text" : "You have reached Clippys Upload limit. Please try again in a few hours.";
      errorDialog.withSelectButton = false;
      errorDialog.show();
      return;
   }
   const successDialog = new Dialog();
   successDialog.imagePath = "/assets/images/happy.png";
   successDialog.title = "You Are Ready To Go!";
   successDialog.selectButtonText = "Copy Overview";
   successDialog.closeOnOutsideClick = !clip.isNew;
   const links = clip.getLinks();
   const keys = clip.getKeys();

   let content = DOM.create("div");
   content.append(DOM.create("t .dialogText").setText("Access Your Clip Here:"));
   content.append(
      DOM.create("div .urlPreviewContainer")
         .append(
            DOM.create("img .copyImage #copyClipUrlIcon [src=/assets/images/copy.png]").onClick(() => {
               GeneralFunctions.copyToClipboard(links.clip);
            }),
         )
         .append(DOM.create(`a .urlPreview #urlToClip [target=_blank] [href=${links.clip}]`).setText(links.clip)),
   );
   content.append(DOM.create("t .dialogText").setText('To edit or delete your Clip, click "edit" and use this secret key. Never share this key:'));
   content.append(
      DOM.create("div .urlPreviewContainer")
         .append(
            DOM.create("img .copyImage #copyControlPanelUrlIcon [src=/assets/images/copy.png]").onClick(() => {
               GeneralFunctions.copyToClipboard(keys.panel);
            }),
         )
         .append(DOM.create(`a .urlPreview #urlToControlPanel [target=_blank] [href=${links.controlPanel}]`).setText(keys.panel)),
   );
   content.append(DOM.create("t .dialogText").setText("Make sure to save the link and the key in a secure location. You won't be able to access them ever again after this window closes."));

   successDialog.content = content.getFirstElement();
   successDialog.show();
   successDialog.selectButtonClicked = () => {
      const clipOverviewString = `${clip.title.toUpperCase()}:\n\n[SHAREABLE] Link to Your Clip:\n${links.clip}\n\n[SECRET] Control Panel Key:\n${keys.panel}\n\n[SECRET] Direct Link to Control Panel:\n${links.controlPanel}`;
      GeneralFunctions.copyToClipboard(clipOverviewString);
   };
   successDialog.onClose = () => {
      if (clip.isNew) {
         DOM.select("textareatitle").setValue("");
         DOM.select("textareatext").setValue("");
         clip = new Clip();
      }
   };
});

document.getElementById("deleteButton").addEventListener("click", () => {
   const deleteDialog = new Dialog();
   deleteDialog.title = "Are You Sure?";
   deleteDialog.imagePath = "/assets/images/trash.png";
   deleteDialog.content = "If you proceed, every bit of data connected to this Clip will be wiped from the server. This action cannot be undone!";
   deleteDialog.selectButtonText = "Delete";
   deleteDialog.closeButtonText = "Keep it";
   deleteDialog.show();
   deleteDialog.selectButtonClicked = async () => {
      const progressDialog = new Dialog("loading");
      progressDialog.title = "Deleting...";
      progressDialog.show();
      const res = await clip.delete();
      progressDialog.close();
      if (res) {
         const successDialog = new Dialog();
         successDialog.withSelectButton = false;
         successDialog.withCloseButton = false;
         successDialog.closeOnOutsideClick = false;
         successDialog.imagePath = "/assets/images/trash.png";
         successDialog.title = "Deleted Successfully";
         successDialog.content =
            "Your Clip has taken its final journey to the land of lost data, leaving behind a void never to be filled again. Remember it fondly, but don't worry – there's plenty of room for new memories. Bye, Clip! 🍃🌈";
         successDialog.show();
      } else {
         window.Location.href = "/";
      }
   };
});

// Ai Title Stuff
const textareatext = DOM.select("textareatext");
const textareatitle = DOM.select("textareatitle");
textareatext.onInput(setAiTitleButtonState, true);
textareatitle.onInput(setAiTitleButtonState, true);

function setAiTitleButtonState() {
   // const active = textareatext.getValue().length > 100 && textareatitle.getValue().length == 0;
   const active = textareatext.getValue().length > 100;
   DOM.select("aiTitleButton").setStyle({
      opacity: active ? "1" : "0.3",
      pointerEvents: active ? "auto" : "none",
   });
}

DOM.select("aiTitleButton").onClick(() => {
   const text = DOM.select("textareatext").getValue();
   Ai.generateTitle(text, false).then((answer) => {
      DOM.select("textareatitle").setValue(answer);
      setAiTitleButtonState();
   });
});
