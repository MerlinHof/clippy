import Dialog from "./Dialog.js";
import DOM from "./dom.js";

// Copies a string to the clipboard using the modern Clipboard API
export async function copyToClipboard(str) {
  showSuccessDialog("Copied To Clipboard");
  try {
    await navigator.clipboard.writeText(str);
  } catch (error) {
    showErrorDialog();
  }
}

// Smoothly scrolls the window to a specified vertical position over a given duration.
export function smoothScrollTo(endY, duration = 1000) {
  const startY = window.scrollY;
  const maxScrollY = document.documentElement.scrollHeight - window.innerHeight;
  const targetY = Math.max(0, Math.min(endY, maxScrollY));
  const distanceY = targetY - startY;
  let startTime = null;

  // Easing-Funktion: EaseInOutCubic für weichere Übergänge
  function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
  }

  function scroll(currentTime) {
    if (startTime === null) {
      startTime = currentTime;
    }
    const timeElapsed = currentTime - startTime;
    const progress = Math.min(timeElapsed / duration, 1); // Stellen Sie sicher, dass der Fortschritt nicht > 1 ist
    window.scrollTo(0, startY + distanceY * easeInOutCubic(progress));
    if (timeElapsed < duration) {
      requestAnimationFrame(scroll);
    }
  }
  requestAnimationFrame(scroll);
}

// Background Animation
export async function startBackgroundAnimation() {
  const container = DOM.create("div")
    .setStyle({
      position: "fixed",
      left: "0px",
      top: "0px",
      width: "100vw",
      height: "100vh",
      opacity: "0",
      zIndex: "-1",
      transition: "2s",
      filter: "blur(0px)",
    })
    .appendTo(document.body);

  await new Promise((resolve) => setTimeout(resolve, 50));
  container.setStyle({
    opacity: 0.15,
    filter: "blur(60px)",
  });

  const width = container.getWidth();
  const height = container.getHeight();

  for (let i = 0; i < 12; i++) {
    DOM.create("div")
      .setStyle({
        width: "300px",
        height: "300px",
        position: "inherit",
        borderRadius: "150px",
      })
      .appendTo(container)
      .onTransitionEnd(
        (elem) => {
          const randomColor = `rgb(${50 + Math.random() * 180}, ${50 + Math.random() * 180}, ${50 + Math.random() * 180})`;
          elem.setStyle({
            transition: `all ${3 + Math.random() * 5}s linear`,
            backgroundColor: randomColor,
          });
          let newX, newY;
          if (Math.random() < 0.5) {
            newX = Math.random() < 0.5 ? 0 : width - 300;
            newY = Math.random() * (height - 300);
          } else {
            newX = Math.random() * (width - 300);
            newY = Math.random() < 0.5 ? 0 : height - 300;
          }
          elem.setStyle({
            left: newX + "px",
            top: newY + "px",
          });
        },
        true,
        true,
      );
  }
}

export function showDonationDialog() {
  const donationDialog = new Dialog();
  donationDialog.title = "We Just Gave You Money! 💚";
  donationDialog.content =
    "No, really! Each and every interaction with the Ai features costs real money, which we currently cover from our private pockets to ensure Clippy remains free and secure for all users. However, with the growing number of users, these expenses accumulate to a considerable sum. This is why we're reaching out for your support. Even a small donation from you can help ensure that Clippy stays free, secure, and independent for the long haul.";
  donationDialog.selectButtonText = "Help Out 💚";
  donationDialog.closeButtonText = "Tomorrow 😒";
  donationDialog.show();
  donationDialog.selectButtonClicked = () => {
    window.open("https://paypal.me/merlinhof", "_blank");
  };
}

export function showAiLimitDialog() {
  const limitDialog = new Dialog();
  limitDialog.title = "Clippy's Limit is Reached 😔";
  limitDialog.content =
    "We regret to inform you that we must enforce a daily cap on Ai requests due to the substantial costs associated with this advanced technology. We apologize for any inconvenience this may cause. Please be assured that normal service will resume the following day. To facilitate an increase in usage limits and to support the continuous enhancement of Clippy, we warmly invite you to consider a donation. Your generous contribution would be immensely valuable for all of our users who seek clarity in our world full of fake information.";
  limitDialog.selectButtonText = "Help Out 💚";
  limitDialog.closeButtonText = "Tomorrow 😒";
  limitDialog.show();
  limitDialog.selectButtonClicked = () => {
    window.open("https://paypal.me/merlinhof", "_blank");
  };
}

export function showErrorDialog() {
  const errorDialog = new Dialog();
  errorDialog.title = "Ooops 😬";
  errorDialog.imagePath = "/assets/images/warning.png";
  errorDialog.content =
    "We're sorry, but there seems to be an issue. Check if you have a working internet connection or try again later. If this is on our end, we'll try to fix the issue as soon as possible.";
  errorDialog.withSelectButton = false;
  errorDialog.show();
}

export function showSuccessDialog(text) {
  const copiedDialog = new Dialog();
  copiedDialog.imagePath = "/assets/images/success.svg";
  copiedDialog.withSelectButton = false;
  copiedDialog.title = text;
  copiedDialog.content = "";
  copiedDialog.withCloseButton = "";
  copiedDialog.closeOnOutsideClick = false;
  copiedDialog.show();
  setTimeout(() => {
    copiedDialog.close();
  }, 800);
}
