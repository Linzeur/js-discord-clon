function showMemberList() {
  let div = document.getElementById("divMembers");
  let svg = document.getElementById("btnPeople");
  div.classList.toggle("state-members");
  svg.classList.toggle("svg-active");
}

function showLeft() {
  let sectionApp = document.getElementById("app-name");
  let sectionChannels = document.getElementById("channels");
  sectionApp.classList.toggle("app-active");
  sectionChannels.classList.toggle("channels-active");
}
