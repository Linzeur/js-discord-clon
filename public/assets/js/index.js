const keyStorage = "app-data";
var attemptConnectionSocket = 0;
var indexChannelActive = 0;
var app, socket;
var firstConnection = true;
var fakemessages = [
  {
    id: 1,
    author: { id: 1, username: "admin" },
    content: "Hi everyone",
    date: new Date("2019-05-20T11:00"),
    isNew: true,
    isNotification: false
  },
  {
    id: 2,
    author: { id: 3, username: "user3" },
    content: "Hi admin, how are you?",
    date: new Date("2019-05-20T11:01"),
    isNew: true,
    isNotification: false
  },
  {
    id: 3,
    author: { id: 3, username: "user3" },
    content: "Whats up everyone!",
    date: new Date("2019-05-20T11:03"),
    isNew: true,
    isNotification: false
  },
  {
    id: 4,
    author: { id: 3, username: "user3" },
    content: "Hi, this message should appear in a new date block",
    date: new Date("2019-05-21T15:00"),
    isNew: true,
    isNotification: false
  },
  {
    id: 5,
    author: { id: 1, username: "admin" },
    content: "Nice",
    date: new Date("2019-05-21T18:00"),
    isNew: true,
    isNotification: false
  }
];

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
    elements += `
    <li class="text_channels">
      <svg><use xlink:href="#hashtag"></svg>
      <span class="each_channel">${channel.name}</span>
    </li>
    `;
  });
  let channelList = document.getElementById("channels_list");
  channelList.innerHTML = elements;
}

function newNotificationElement(message) {
  return `
  <li class="container-notification -b-top">
    <svg><use xlink:href="#arrow-right"/></svg>
    <span class="group-notification">${message.content.replace(
      message.author.username,
      `<span class='user'>${message.author.username}</span>`
    )}</span>
    <span class="date">${Date(message.date)}</span>
  </li>
  `;
}

function newMessageBlockHeader(message) {
  return `
  <li class="container-messages -b-top">
    <div class="user-img">
      <img
        src="https://discordapp.com/assets/0e291f67c9274a1abdddeb3fd919cbaa.png"
        alt="user-image"
      />
    </div>
    <div class="user-messages">
      <ul>
        <li class="container-user">
          <span class="user">${message.author.username}</span>
          <span class="date">${message.date}</span>
        </li>
  `;
}

function newMessageBlockFooter() {
  return `
        </ul>
    </div>
  </li>
  `;
}

function newMessageBlockElement(message) {
  return `
    <li class="talk">${message.content}</li>
  `;
}

function listAllMessages() {
  let messaggesList = "";
  let arrayOfMessages = app.channels[indexChannelActive].messages;

  arrayOfMessages.forEach((message, index, messages) => {
    if (message.hasOwnProperty("isNotification")) {
      if (index == 0 || messages[index - 1].isNotification) {
        if (message.isNotification) {
          messaggesList += newNotificationElement(message);
          message.isNew = false;
        } else {
          messaggesList += newMessageBlockHeader(message);
          messaggesList += newMessageBlockElement(message);
          message.isNew = false;
        }
      } else if (messages[index - 1].author.id != message.author.id) {
        messaggesList += newMessageBlockFooter();
        messaggesList += newMessageBlockHeader(message);
        messaggesList += newMessageBlockElement(message);
        message.isNew = false;
      } else {
        messaggesList += newMessageBlockElement(message);
        message.isNew = false;
      }
    }
  });
  if (!arrayOfMessages[arrayOfMessages.length - 1].isNotification) {
    messaggesList += newMessageBlockFooter();
  }
  let $messagesContainer = document.getElementById("messages_container");
  $messagesContainer.innerHTML = messaggesList;
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
    if (firstConnection) listAllMessages();
    firstConnection = false;
  }
}

function connectionSocket() {
  socket = new WebSocket("ws://192.168.86.81:3000");

  socket.addEventListener("open", initializeConnection);

  socket.addEventListener("close", () => {
    console.log("Reconnection");
    socket.close();
    attemptConnectionSocket++;
    if (attemptConnectionSocket < 4) connectionSocket();
    else {
      console.log("Server could has been shutdown");
      attemptConnectionSocket = 0;
    }
  });
  socket.addEventListener("message", event => {
    if (event.data == "anyUserActive") {
      let messageToSend = { userConnected: app.users };
      socket.send(JSON.stringify(messageToSend));
    } else {
      let receivedData = JSON.parse(event.data);
      console.log(receivedData);
      app.channels[indexChannelActive].messages.push(receivedData);
      localStorage.setItem(keyStorage, JSON.stringify(app));
    }
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
    listAllMessages();
  } else {
    window.location.href = "login.html";
  }
};
