const keyStorage = "app-data";
const maxAttempt = 20;

var attemptConnectionSocket = 0;
var indexChannelActive = 0;
var app, socket;
var firstConnection = true;
var fakemessages = [
  {
    id: 1,
    author: { id: 1, username: "admin" },
    content: "Hi everyone",
    date: new "2019-05-20T11:00"(),
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
    <span class="date">
    ${new Date(message.date).toLocaleTimeString()}
    </span>
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
          <span class="date">
          ${new Date(message.date).toLocaleTimeString()}
          </span>
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

  if (arrayOfMessages.length > 0) {
    arrayOfMessages.forEach((message, index, messages) => {
      if (index == 0 || messages[index - 1].isNotification) {
        if (message.isNotification) {
          messaggesList += newNotificationElement(message);
        } else {
          messaggesList += newMessageBlockHeader(message);
          messaggesList += newMessageBlockElement(message);
        }
      } else if (messages[index].isNotification) {
        messaggesList += newMessageBlockFooter();
        messaggesList += newNotificationElement(message);
      } else if (messages[index - 1].author.id != message.author.id) {
        messaggesList += newMessageBlockFooter();
        messaggesList += newMessageBlockHeader(message);
        messaggesList += newMessageBlockElement(message);
      } else {
        messaggesList += newMessageBlockElement(message);
      }
      message.isNew = false;
    });

    if (!arrayOfMessages[arrayOfMessages.length - 1].isNotification)
      messaggesList += newMessageBlockFooter();

    let $messagesContainer = document.getElementById("messages_container");
    $messagesContainer.innerHTML = messaggesList;
  }
}

function appendNewMessage(message) {
  let $messages_container = document.getElementById("messages_container");
  let arrayOfMessages = app.channels[indexChannelActive].messages;
  let lastMessage = arrayOfMessages[arrayOfMessages.length - 1];

  if (message.isNotification) {
    $messages_container.innerHTML += newNotificationElement(message);
  } else if (
    lastMessage.isNotification ||
    message.author.id != lastMessage.author.id
  ) {
    $messages_container.innerHTML +=
      newMessageBlockHeader(message) +
      newMessageBlockElement(message) +
      newMessageBlockFooter();
  } else {
    $messages_container.lastElementChild.lastElementChild.firstElementChild.innerHTML += newMessageBlockElement(
      message
    );
  }
}

function filterOwnMessages(messageReceived) {
  return !(
    messageReceived.isNotification &&
    messageReceived.author.id == app.currentuser.id &&
    messageReceived.content.indexOf("Welcome") == -1
  );
}

function modifyStateUsers(idUser, newState) {
  let indexUserFound = app.users.findIndex(user => user.id == idUser);
  app.users[indexUserFound].isActive = newState;
}

function receiveMessages(data) {
  if (filterOwnMessages(data)) {
    if (data.isNotification) {
      //There are two types of messages with property isNotification = true, to send:
      //1.- When an user is joint first time
      //2.- When an user is connected after a while

      if (data.content.indexOf("has joint to this group") > -1) {
        let newUserJoint = data.author;
        newUserJoint["isActive"] = true;
        app.users = app.users.concat(newUserJoint);
      } else modifyStateUsers(data.author.id, true);
    }

    console.log(data);
    appendNewMessage(data);
    app.channels[indexChannelActive].messages.push(data);
    localStorage.setItem(keyStorage, JSON.stringify(app));
  }
}

function initializeConnection() {
  attemptConnectionSocket = 0;
  if (window.performance.navigation.type == 0) {
    if (firstConnection) {
      let user = app.currentuser;
      let messageForAll = "";

      if (!app.channels[0].joined) {
        let messageForYou = "Welcome " + user.username;

        messageForAll = user.username + " has joint to this group";
        app.channels[indexChannelActive].joined = true;
        app.channels[indexChannelActive].messages.push(
          createNewMessage(messageForYou, user, true)
        );
      } else messageForAll = user.username + " has connected";

      let newMessage = createNewMessage(messageForAll, user, true);

      socket.send(JSON.stringify(newMessage));
      localStorage.setItem(keyStorage, JSON.stringify(app));
      listAllMessages();
      firstConnection = false;
    }
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
  socket = new WebSocket("ws://192.168.86.55:3000");

  socket.addEventListener("open", initializeConnection);

  socket.addEventListener("message", event => {
    if (event.data == "anyUserActive") {
      let messageToSend = { usersConnected: app.users };
      socket.send(JSON.stringify(messageToSend));
    } else if (event.data.indexOf("userDisconnected") > -1) {
      let idUserDisconnected = event.data.split("|")[1] * 1;
      modifyStateUsers(idUserDisconnected, false);
      localStorage.setItem(keyStorage, JSON.stringify(app));
    } else if (event.data.indexOf("usersConnected") == -1) {
      let receivedData = JSON.parse(event.data);
      receiveMessages(receivedData);
    }
  });

  socket.addEventListener("close", reconnectServer);
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

window.onbeforeunload = function() {
  let userNotActive = "userDisconnected|" + app.currentuser.id;
  if (socket.readyState == 1) {
    socket.send(userNotActive);
    socket.close();
  }
};
