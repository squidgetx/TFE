import { CONFIG } from "./config";

window.onload = () => {
  document.getElementById("link").href = CONFIG.recontactURL;
  document
    .querySelectorAll(".reward")
    .forEach((e) => (e.innerHTML = CONFIG.rewardDollars));
};
