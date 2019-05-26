const keyStorage = "app-data",
  pageToRedirect = "index.html";
const timePingMembers = 3000,
  maxAttempt = 20;

var attemptConnectionSocket = 0;
var usersJoint = [];
var socket;

function newAppObject(newUsername) {
  let newId = Date.now();
  let obj = {
    currentuser: {
      id: newId,
      username: newUsername,
      creationDate: new Date().toLocaleString(),
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
  obj.users = obj.users.concat(usersJoint);

  return obj;
}

function askConnectedMembers() {
  attemptConnectionSocket = 0;
  socket.send("anyUserActive");
  setInterval(function() {
    if (socket.readyState == 1) socket.send("anyUserActive");
  }, timePingMembers);
}

function getNumberConnectedMembers(message) {
  if (message.indexOf("usersConnected") > -1) {
    let jsonMessage = JSON.parse(message);

    usersJoint = Array.from(jsonMessage.usersConnected);
    let usersConnected = usersJoint.filter(userObj => userObj.isActive).length;
    let totalMembers = usersJoint.length;

    document.getElementById("spnOnline").innerHTML = `${usersConnected} Online`;
    document.getElementById("spnTotal").innerHTML = `${totalMembers} Members`;
  }
}

function reconnectServer() {
  console.log("Reconnection");
  attemptConnectionSocket++;
  if (attemptConnectionSocket < maxAttempt) connectionSocket();
  else {
    console.log("Server could has been shutdown");
    attemptConnectionSocket = 0;
  }
}

function connectionSocket() {
  socket = new WebSocket("ws://localhost:3000");

  socket.addEventListener("open", askConnectedMembers);

  socket.addEventListener("message", event =>
    getNumberConnectedMembers(event.data)
  );

  socket.addEventListener("close", reconnectServer);
}

function loginUser(event) {
  event.preventDefault();
  let txtUsername = document.getElementById("txtUsername");
  if (txtUsername.value.trim().length > 0) {
    let appObj = newAppObject(txtUsername.value.trim());
    localStorage.setItem(keyStorage, JSON.stringify(appObj));
    window.location.href = pageToRedirect;
  } else {
    txtUsername.focus();
    return false;
  }
}

function assignEvents() {
  connectionSocket();

  let btnContinue = document.getElementById("btnContinue");
  btnContinue.addEventListener("click", event => loginUser(event));
}

window.onload = function() {
  if (localStorage.getItem(keyStorage)) window.location.href = pageToRedirect;
  else assignEvents();
};
