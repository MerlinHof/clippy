// This file contains a set of functions for working with encryption and hashing in JavaScript.

// Hashes a Message
export async function hash(message) {
   const msgBuffer = new TextEncoder().encode(message);
   const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
   const hashArray = Array.from(new Uint8Array(hashBuffer));
   const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
   return hashHex;
}

// Encrypts a Message
export async function encrypt(text, keyString) {
   const encoder = new TextEncoder();
   const data = encoder.encode(text);
   const keyData = encoder.encode(keyString.padEnd(32, " ")); // Padding, um sicherzustellen, dass der Schlüssel 256 Bits hat
   const cryptoKey = await crypto.subtle.importKey("raw", keyData, { name: "AES-GCM" }, false, ["encrypt"]);
   const iv = crypto.getRandomValues(new Uint8Array(12));
   const encryptedData = await crypto.subtle.encrypt(
      {
         name: "AES-GCM",
         iv: iv,
      },
      cryptoKey,
      data,
   );

   const encryptedArray = new Uint8Array(encryptedData);
   const ivAndEncryptedData = new Uint8Array(iv.length + encryptedArray.length);
   ivAndEncryptedData.set(iv);
   ivAndEncryptedData.set(encryptedArray, iv.length);
   let result = "";
   for (let i = 0; i < ivAndEncryptedData.length; i++) {
      result += String.fromCharCode(ivAndEncryptedData[i]);
   }
   return btoa(result);
}

// Decrypts a Message
export async function decrypt(encryptedText, keyString) {
   const encryptedData = Uint8Array.from(atob(encryptedText), (c) => c.charCodeAt(0));
   const iv = encryptedData.slice(0, 12);
   const actualEncryptedData = encryptedData.slice(12);
   const encoder = new TextEncoder();
   const keyData = encoder.encode(keyString.padEnd(32, " ")); // Padding
   const cryptoKey = await crypto.subtle.importKey("raw", keyData, { name: "AES-GCM" }, false, ["decrypt"]);
   try {
      const decryptedData = await crypto.subtle.decrypt(
         {
            name: "AES-GCM",
            iv: iv,
         },
         cryptoKey,
         actualEncryptedData,
      );
      const decoder = new TextDecoder();
      return decoder.decode(decryptedData);
   } catch (e) {
      return false;
   }
}

// Generates a cryptographically secure random string of fixed length.
export function cryptoRandomString() {
   const length = 15;
   const chars = "abcdefghijklmnopqrstuvwxyz0123456789".split("");
   let result = "";
   const randomArray = new Uint8Array(length);
   crypto.getRandomValues(randomArray);
   for (let i = 0; i < length; i++) {
      result += chars[randomArray[i] % chars.length];
   }
   return result;
}
