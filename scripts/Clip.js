import * as Security from "./security.js";
import * as GeneralFunctions from "./general.js";

export default class Clip {
   id = "";
   encryptionKey = "";
   panelKey = "";
   title = "";
   text = "";
   isNew = true;

   constructor(id, encryptionKey) {
      if (id?.length > 1 && encryptionKey?.length > 1) {
         this.id = id;
         this.encryptionKey = encryptionKey;
         this.isNew = false;
      }
   }

   async read() {
      const res = await this.callClipController("read", { id: this.id });
      if (!res.body || res.error) return false;
      const decryptedContent = await Security.decrypt(res.body, this.encryptionKey);
      if (!decryptedContent) return false;
      let contentObj = [];
      try {
         contentObj = JSON.parse(decryptedContent);
      } catch (e) {
         return false;
      }
      this.title = contentObj.title;
      this.text = contentObj.text;
      return true;
   }

   // Uploads a clip (as initial upload or update)
   async upload() {
      if (this.title.length == 0 || this.text.length == 0) return 0;
      if (this.isNew) {
         this.encryptionKey = Security.cryptoRandomString();
         this.panelKey = Security.cryptoRandomString();
      }
      const hashedPanelKey = await Security.hash("clippy" + this.panelKey);
      const clipBodyString = JSON.stringify({ title: this.title, text: this.text });
      const encryptedBody = await Security.encrypt(clipBodyString, this.encryptionKey);
      const data = {
         body: encryptedBody,
         hashedPanelKey: hashedPanelKey,
         id: this.id,
         panelKey: this.panelKey,
      };
      const res = await this.callClipController("upload", data);
      if (res.error && res.error == "limit") return 1;
      if (!res.id || res.error) window.location.href = "/";
      if (this.isNew) this.id = res.id;
      return true;
   }

   async delete() {
      const data = {
         id: this.id,
         panelKey: this.panelKey,
      };
      const res = await this.callClipController("delete", data);
      return !res.error && res.success;
   }

   // Checks if the given panelKey is correct
   async checkPanelKey(panelKey) {
      const data = { id: this.id, panelKey: panelKey };
      const res = await this.callClipController("checkpanelkey", data);
      return !res.error && res.success;
   }

   // Generates links for accessing the Clip and its Control Panel
   getLinks() {
      const baseUrl = `${window.location.protocol}//${window.location.host}/${window.location.pathname.split("/")[1]}`;
      const linkToClip = `${baseUrl}?id=${this.id}#${this.encryptionKey}`;
      const linkToControlPanel = `${baseUrl}?id=${this.id}&panelkey=${this.panelKey}#${this.encryptionKey}`;
      return {
         clip: linkToClip,
         controlPanel: linkToControlPanel,
      };
   }

   // Makes a HTTP Request to the backend
   async callClipController(action, data) {
      const postBody = {
         action: action,
         csrf_token: csrf_token,
      };
      for (const key in data) {
         postBody[key] = data[key];
      }
      const res = await fetch("/apis/clipController.php", {
         method: "POST",
         body: JSON.stringify(postBody),
      });
      let obj = "";
      if (res.ok) {
         obj = await res.json();
      } else {
         GeneralFunctions.showErrorDialog();
      }
      return obj;
   }
}
