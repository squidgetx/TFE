import { CONFIG } from "./config";
import { intervalToDuration } from "date-fns";

if (CONFIG.trackUninstall) {
  chrome.runtime.setUninstallURL(CONFIG.uninstallEndpoint);
}

if (CONFIG.recontact) {
  setInterval(() => {
    chrome.storage.sync.get(
      ["install_time", "last_recontact"],
      function (result) {
        if (!result.install_time) {
          return;
        }
        const sinceInstall = intervalToDuration({
          start: result.install_time,
          end: Date.now(),
        });
        const inRecontactPeriod =
          sinceInstall.days >= CONFIG.recontactMinInterval &&
          sinceInstall.days < CONFIG.recontactMaxInterval;
        const sinceLastPrompt = intervalToDuration({
          start: result.last_recontact,
          end: Date.now(),
        });
        const promptedRecently = sinceLastPrompt.hours < 4;
        if (inRecontactPeriod && !promptedRecently) {
          chrome.tabs.create({
            url: "recontact.html",
            active: false,
          });
          chrome.storage.sync.set({
            last_recontact: Date.now(),
          });
        }
      }
    );
  }, 10000);
}
