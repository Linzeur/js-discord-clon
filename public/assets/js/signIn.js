const keyStorage = "app-data",
  pageToRedirect = "index.html";
const timePingMembers = 5000;

var attemptConnectionSocket = 0;

var socket;

function newAppObject(newUsername) {
  let newId = Date.now();
  return {
    currentuser: {
      id: newId,
      username: newUsername,
      creationDate: new Date(),
      state: "active"
    },
    users: [
      {
        id: newId,
        username: newUsername,
        isActive: true
      }
    ],
    channels: [
      {
        id: 1000000000000,
        creationDate: null,
        name: "general",
        author: null,
        joined: false,
        visibility: true,
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

function askConnectedMembers() {
  setInterval(function() {
    if (socket.readyState == 1) socket.send("anyUserActive");
  }, timePingMembers);
}

function getNumberConnectedMembers(message) {
  if (message.indexOf("userConnected") > -1) {
    let jsonMessage = JSON.parse(message);
    let usersConnected = jsonMessage.usersConnected.filter(
      userObj => userObj.isActive
    ).length;
    let totalMembers = jsonMessage.usersConnected.length;
    document.getElementById("spnOnline").innerHTML = `${usersConnected} Online`;
    document.getElementById("spnTotal").innerHTML = `${totalMembers} Members`;
  }
}

function connectionSocket() {
  socket = new WebSocket("ws://192.168.86.81:3000");

  socket.addEventListener("open", askConnectedMembers);

  socket.addEventListener("close", () => {
    console.log("Reconnection");
    attemptConnectionSocket++;
    if (attemptConnectionSocket < 4) connectionSocket();
    else {
      console.log("Server could has been shutdown");
      attemptConnectionSocket = 0;
    }
  });
  socket.addEventListener("message", event =>
    getNumberConnectedMembers(event.data)
  );
}

function assignEvents() {
  connectionSocket();

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
