const keyStorage = "app-data";
var attemptConnectionSocket = 0;
var app, socket;

function createNewChannel(name, author) {
  return {
    id: Date.now(),
    creationDate: new Date(),
    name: name,
    author: author,
    joined: true,
    messages: []
  };
}

function createNewMessage(message, author, typeMessage) {
  return {
    id: Date.now(),
    author: { id: author.id, username: author.username },
    content: message,
    date: new Date(),
    isNew: true,
    isNotification: typeMessage
  };
}

function addChannel(name, author) {
  if (name.trim().length == 0) return -1;

  if (!app.channels.some(channel => channel.name == name)) {
    let newChannel = createNewChannel(name, author);
    app.channels.push(newChannel);
    return 1;
  }
  return 0;
}

function listChannels() {
  let elements = "";
  app.channels.forEach(channel => {
    elements += `<li>${channel.name}</li>`;
  });
  let channelList = document.getElementById("channels_list");
  channelList.innerHTML = elements;
}

function initializeConnection() {
  if (window.performance.navigation.type == 0) {
    let user = app.currentuser;
    let messageForAll = "";

    if (!app.channels[0].joined) {
      let messageForYou = "Welcome " + user.username;

      messageForAll = user.username + " has joined to this group";
      app.channels[0].joined = true;
      app.channels[0].messages.push(
        createNewMessage(messageForYou, user, true)
      );
    } else messageForAll = user.username + " has connected";

    let newMessage = createNewMessage(messageForAll, user, true);
    socket.send(JSON.stringify(newMessage));
    localStorage.setItem(keyStorage, JSON.stringify(app));
  }
}

function connectionSocket() {
  socket = new WebSocket("ws://192.168.86.55:3000");

  socket.addEventListener("open", initializeConnection);

  socket.addEventListener("close", () => {
    console.log("Disconnection");
    attemptConnectionSocket++;
    if (attemptConnectionSocket < 4) connectionSocket();
    else console.log("Server could has been shutdown");
  });
  socket.addEventListener("message", event => {
    let receivedData = JSON.parse(event.data);
    if (receivedData.author.id != app.currentuser.id) {
      console.log(receivedData);
    }
  });
}

function assignEvents() {
  let $formAddChannel = document.getElementById("addChannelForm");
  $formAddChannel.addEventListener("submit", handleAddChannelSubmit);

  connectionSocket();
}

function handleAddChannelSubmit(event) {
  event.preventDefault();
  let $error = document.getElementById("channelError");
  $error.innerText = "";
  let $newChannelName = event.target.elements.newChannelName;
  let user = {
    id: app.currentuser.id,
    username: app.currentuser.username
  };

  let result = addChannel($newChannelName.value, user);

  if (result == 1) {
    listChannels();
    $newChannelName.value = "";
  } else if (result == 0) {
    console.log("entro a 0");
    $error.innerText = "This channel already exists";
  } else {
    $error.innerText = "Invalid channel name";
  }
}

window.onload = function() {
  app = JSON.parse(localStorage.getItem(keyStorage));
  assignEvents();
  listChannels();
};
