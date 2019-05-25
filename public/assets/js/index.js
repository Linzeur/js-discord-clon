const keyStorage = "app-data";
const maxAttempt = 20;

var attemptConnectionSocket = 0;
var indexChannelActive = 0;
var firstConnection = true;
var app, socket, stateNotification;
var fakemessages = [
  {
    id: 1,
    author: { id: 1, username: "admin" },
    content: "Hi everyone",
    date: new Date("2019-05-20T11:00").toLocaleString(),
    isNew: true,
    isNotification: false
  },
  {
    id: 2,
    author: { id: 3, username: "user3" },
    content: "Hi admin, how are you?",
    date: new Date("2019-05-20T11:01").toLocaleString(),
    isNew: true,
    isNotification: false
  },
  {
    id: 3,
    author: { id: 3, username: "user3" },
    content: "Whats up everyone!",
    date: new Date("2019-05-20T11:03").toLocaleString(),
    isNew: true,
    isNotification: false
  },
  {
    id: 4,
    author: { id: 3, username: "user3" },
    content: "Hi, this message should appear in a new date block",
    date: new Date("2019-05-21T15:00").toLocaleString(),
    isNew: true,
    isNotification: false
  },
  {
    id: 5,
    author: { id: 1, username: "admin" },
    content: "Nice",
    date: new Date("2019-05-21T18:00").toLocaleString(),
    isNew: true,
    isNotification: false
  }
];

function createNewChannel(name, author) {
  return {
    id: Date.now(),
    creationDate: new Date().toLocaleString(),
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
    date: new Date().toLocaleString(),
    isNew: true,
    isNotification: typeMessage
  };
}

function addChannel(name, author) {
  if (name.length == 0) return -1;

  if (!app.channels.some(channel => channel.name == name)) {
    let newChannel = createNewChannel(name, author);
    app.channels.push(newChannel);
    newChannel.joined = false;

    if (socket.readyState == 1)
      socket.send("newChannel|" + JSON.stringify(newChannel));

    return 1;
  }

  return 0;
}

function listChannels() {
  let elements = "";
  app.channels.forEach((channel, index) => {
    elements += `
    <li class="text_channels" data-index-channel="${index}">
      <svg><use xlink:href="#hashtag"></svg>
      <span class="each_channel">${channel.name}</span>
    </li>
    `;
  });
  let channelList = document.getElementById("channels_list");
  channelList.innerHTML = elements;
}

function goToChannelFirstTime(indexListChannel) {
  app.channels[indexChannelActive].visibility = false;
  indexChannelActive = indexListChannel;
  app.channels[indexChannelActive].visibility = true;
  app.channels[indexChannelActive].joined = true;
  console.log(indexChannelActive);
  console.log(app.channels[indexChannelActive].name);
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

function newDateSeparator(date) {
  return `
    <li class="line">
      <span class="line-date">${new Date(date).toDateString()}</span>
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
      if (index == 0) {
        messaggesList += newDateSeparator(message.date);
        if (message.isNotification) {
          messaggesList += newNotificationElement(message);
        } else {
          messaggesList += newMessageBlockHeader(message);
          messaggesList += newMessageBlockElement(message);
        }
      } else if (messages[index - 1].isNotification) {
        if (
          new Date(messages[index - 1].date).getDate() !=
          new Date(message.date).getDate()
        ) {
          messaggesList += newDateSeparator(message.date);
        }
        if (message.isNotification) {
          messaggesList += newNotificationElement(message);
        } else {
          messaggesList += newMessageBlockHeader(message);
          messaggesList += newMessageBlockElement(message);
        }
      } else if (message.isNotification) {
        messaggesList += newMessageBlockFooter();
        if (
          new Date(messages[index - 1].date).getDate() !=
          new Date(message.date).getDate()
        ) {
          messaggesList += newDateSeparator(message.date);
        }
        messaggesList += newNotificationElement(message);
      } else if (messages[index - 1].author.id != message.author.id) {
        messaggesList += newMessageBlockFooter();
        if (
          new Date(messages[index - 1].date).getDate() !=
          new Date(message.date).getDate()
        ) {
          messaggesList += newDateSeparator(message.date);
        }
        messaggesList += newMessageBlockHeader(message);
        messaggesList += newMessageBlockElement(message);
      } else {
        if (
          new Date(messages[index - 1].date).getDate() !=
          new Date(message.date).getDate()
        ) {
          messaggesList += newMessageBlockFooter();
          messaggesList += newDateSeparator(message.date);
          messaggesList += newMessageBlockHeader(message);
        }
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
  let newdate = new Date(message.date);
  let oldDate = new Date(lastMessage.date);
  let haveDifferentDate = oldDate.getDate() != newdate.getDate();
  if (haveDifferentDate) {
    $messages_container.innerHTML += newDateSeparator(message.date);
  }

  if (message.isNotification) {
    $messages_container.innerHTML += newNotificationElement(message);
  } else if (
    lastMessage.isNotification ||
    message.author.id != lastMessage.author.id ||
    haveDifferentDate
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

async function createNotificationAPI() {
  stateNotification = Notification.permission;
  switch (stateNotification) {
    case "granted": {
      return;
    }
    case "denied": {
      console.log("Doesn't has permissions");
      return;
    }
    case "default": {
      stateNotification = await Notification.requestPermission();
    }
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
  createNotificationAPI();
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
    let data = event.data;
    if (data == "anyUserActive") {
      let messageToSend = { usersConnected: app.users };
      socket.send(JSON.stringify(messageToSend));
    } else if (data.indexOf("userDisconnected") > -1) {
      let idUserDisconnected = data.split("|")[1] * 1;
      modifyStateUsers(idUserDisconnected, false);
      localStorage.setItem(keyStorage, JSON.stringify(app));
    } else if (data.indexOf("newChannel") > -1) {
      let receivedData = JSON.parse(data.split("|")[1]);
      if (receivedData.author.id != app.currentuser.id) {
        app.channels.push(receivedData);
        if (stateNotification == "granted") {
          const notification = new Notification("New channel was created", {
            body: `The name of channel is ${receivedData.name}`,
            icon: "/assets/img/discord_icon.ico",
            image: "/assets/img/discord_icon.ico"
          });
          notification.addEventListener(
            "click",
            goToChannelFirstTime.bind(null, app.channels.length - 1)
          );
        }
        localStorage.setItem(keyStorage, JSON.stringify(app));
      }
    } else if (data.indexOf("usersConnected") == -1) {
      let receivedData = JSON.parse(data);
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
    localStorage.setItem(keyStorage, JSON.stringify(app));
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
    let sectionInfoUser = document.getElementsByClassName("channel_bottom2")[0];
    let listChilds = sectionInfoUser.children;
    listChilds[0].innerText = app.currentuser.username;
    listChilds[1].innerText = app.currelistChildsntuser.id;
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
