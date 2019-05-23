const keyStorage = "app-data";
var attemptConnectionSocket = 0;
var indexChannelActive = 0;
var app, socket;

function createNewChannel(name, author) {
  return {
    id: Date.now(),
    creationDate: new Date(),
    name: name,
    author: author,
    joined: true,
    visibility: false,
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
  if (name.length == 0) return -1;

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
      app.channels[indexChannelActive].joined = true;
      app.channels[indexChannelActive].messages.push(
        createNewMessage(messageForYou, user, true)
      );
    } else messageForAll = user.username + " has connected";

    let newMessage = createNewMessage(messageForAll, user, true);
    socket.send(JSON.stringify(newMessage));
    localStorage.setItem(keyStorage, JSON.stringify(app));
  }
}

function connectionSocket() {
  socket = new WebSocket("ws://192.168.86.81:3000");

  socket.addEventListener("open", initializeConnection);

  socket.addEventListener("close", () => {
    console.log("Disconnection");
    socket.close();
    attemptConnectionSocket++;
    if (attemptConnectionSocket < 4) connectionSocket();
    else {
      console.log("Server could has been shutdown");
      attemptConnectionSocket = 0;
    }
  });
  socket.addEventListener("message", event => {
    let receivedData = JSON.parse(event.data);
    console.log(receivedData);
    app.channels[indexChannelActive].messages.push(receivedData);
    localStorage.setItem(keyStorage, JSON.stringify(app));
  });
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

  let result = addChannel($newChannelName.value.trim(), user);

  if (result == 1) {
    listChannels();
    $newChannelName.value = "";
  } else if (result == 0) {
    $error.innerText = "This channel already exists";
  } else {
    $error.innerText = "Invalid channel name";
  }
}

function handleAddMessageSubmit(event) {
  event.preventDefault();
  let $message = document.getElementById("txtMessage");
  if ($message.value.trim().length != 0) {
    let user = app.currentuser;
    let newMessage = createNewMessage($message.value.trim(), user, false);
    app.channels[indexChannelActive].messages.push(newMessage);
    socket.send(JSON.stringify(newMessage));
    $message.value = "";
  }
}

function assignEvents() {
  let $formAddChannel = document.getElementById("addChannelForm");
  $formAddChannel.addEventListener("submit", handleAddChannelSubmit);

  let $formSendMessage = document.getElementById("sendMessageForm");
  $formSendMessage.addEventListener("submit", handleAddMessageSubmit);

  connectionSocket();
}

window.onload = function() {
  let storedData = localStorage.getItem(keyStorage);
  if (storedData) {
    app = JSON.parse(storedData);
    assignEvents();
    listChannels();
  } else {
    window.location.href = "login.html";
  }
};
