import { CONFIG } from "./config";
import { intervalToDuration } from "date-fns";

const ALARM = "recontact_alarm";
const NOTIF = "recontact_notif";

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
          sinceInstall.days >= CONFIG.recontactIntervalDays;
        const sinceLastPrompt = intervalToDuration({
          start: result.last_recontact,
          end: Date.now(),
        });
        const promptedRecently =
          sinceLastPrompt.minutes < CONFIG.recontactReminderHours * 60;
        if (inRecontactPeriod && !promptedRecently) {
          chrome.tabs.create({
            url: "recontact.html",
            active: false,
            index: 0,
          });
          chrome.notifications.create(NOTIF, {
            type: "basic",
            iconUrl: "alarm128.png",
            title: "Extension Survey Study Final Stage!",
            message: "Complete a short survey and earn a $5 reward!",
            priority: 2,
          });
          chrome.storage.sync.set({
            last_recontact: Date.now(),
          });
        }
      }
    );
  }, 10000);
}
chrome.notifications.onClicked.addListener(function (notifId) {
  if (notifId == NOTIF) {
    console.log("notif was clicked");
    chrome.tabs.create({
      url: "recontact.html",
      active: true,
    });
    //handle notification 1 being clicked
  }
});
