import Dialog from "/scripts/Dialog.js";
import { startBackgroundAnimation, copyToClipboard } from "/scripts/general.js";

// Setup
startBackgroundAnimation();
setTimeout(() => {
   document.getElementById("mainContainer").style.opacity = "1";
}, 100);

// Drag & Drop
document.body.addEventListener("dragover", (event) => {
   event.preventDefault();
   document.getElementById("mainContainer").style.opacity = "0.3";
});
document.body.addEventListener("dragend", () => {
   document.getElementById("mainContainer").style.opacity = "1";
});
document.body.addEventListener("dragleave", () => {
   document.getElementById("mainContainer").style.opacity = "1";
});
document.body.addEventListener("drop", (event) => {
   event.preventDefault();
   document.getElementById("mainContainer").style.opacity = "1";
   if (event.dataTransfer.items) {
      for (let item of event.dataTransfer.items) {
         if (item.kind === "file") {
            let file = item.getAsFile();
            uploadFile(file);
         }
      }
   } else {
      for (let file of event.dataTransfer.files) {
         uploadFile(file);
      }
   }
});

document.getElementById("uploadButton").addEventListener("click", function () {
   let input = document.createElement("input");
   input.type = "file";
   input.accept = "image/*";
   input.style.display = "none";
   input.onchange = (e) => {
      let file = e.target.files[0];
      if (file) {
         uploadFile(file);
      }
      e.target.value = "";
      document.body.removeChild(input);
   };
   document.body.appendChild(input);
   input.click();
});

// Handles the Upload
async function uploadFile(file) {
   if (file.size > 8 * 1024 * 1024) {
      showErrorDialog("Your image must be smaller than 8 MB. Please try again with a smaller file.");
      return;
   }

   const progressDialog = new Dialog("loading");
   progressDialog.title = "Uploading...";
   progressDialog.show();

   let formData = new FormData();
   formData.append("image", file);
   formData.append("csrf_token", csrf_token);
   let res = await fetch("upload.php", {
      method: "POST",
      body: formData,
   });
   let data = res.ok ? await res.json() : [];
   progressDialog.close();
   if (data.error) {
      if (data.error == "limit") {
         showErrorDialog("You have reached Clippys Upload-Limit. Please try again tomorrow.");
      } else {
         showErrorDialog("An error occurred with your upload. Please try again.");
      }
      return;
   }
   if (data.id?.length > 0) {
      const baseUrl = `${window.location.protocol}//${window.location.host}/${window.location.pathname.split("/")[1]}`;
      // const urlToImage = `${baseUrl}?id=${data.id}`;
      const urlToImage = `${baseUrl}/${data.id}`;
      const successDialog = new Dialog();
      successDialog.title = "Success";
      successDialog.imagePath = "/assets/images/success.svg";
      successDialog.content = "Your image was uploaded successfully, you can find it here: " + urlToImage;
      successDialog.selectButtonText = "Copy";
      successDialog.selectButtonClicked = () => {
         copyToClipboard(urlToImage);
      };
      successDialog.show();
      return;
   } else {
      showErrorDialog();
   }
}

function showErrorDialog(message) {
   if (!message) {
      message = "Something went wrong. Please try again.";
   }
   const errorDialog = new Dialog();
   errorDialog.title = "Sorry 😬";
   errorDialog.imagePath = "/assets/images/warning.png";
   errorDialog.content = message;
   errorDialog.withSelectButton = false;
   errorDialog.show();
}
