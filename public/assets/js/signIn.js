const keyStorage = "app-data",
  pageToRedirect = "index.html";

var socket;

function newAppObject(newUsername) {
  return {
    currentuser: {
      id: Date.now(),
      username: newUsername,
      creationDate: new Date(),
      state: "active"
    },
    users: [],
    channels: [
      {
        id: 1000000000000,
        creationDate: null,
        name: "general",
        author: null,
        joined: false,
        messages: []
      }
    ]
  };
}

function createUser() {
  event.preventDefault();
  let username = document.getElementById("txtUsername").value;
  let appObj = newAppObject(username);
  localStorage.setItem(keyStorage, JSON.stringify(appObj));
}

function assignEvents() {
  socket = new WebSocket("ws://192.168.86.81:3000");

  //Events to use when we want to get the number of people connected
  socket.addEventListener("open", () => {
    console.log("Connection open");
  });
  socket.addEventListener("close", () => {
    console.log("Connection closed");
  });
  socket.addEventListener("message", event => {
    console.log(JSON.parse(event.data));
  });

  let btnContinue = document.getElementById("btnContinue");
  btnContinue.addEventListener("click", function() {
    createUser();
    window.location.href = pageToRedirect;
  });
}

window.onload = function() {
  if (localStorage.getItem(keyStorage)) window.location.href = pageToRedirect;
  else assignEvents();
};
