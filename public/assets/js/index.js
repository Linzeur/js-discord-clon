const keyStorage = "app-data";
const maxAttempt = 20;

var attemptConnectionSocket = 0;
var indexChannelActive = 0;
var firstConnection = true,
  isPageVisible = true;
var app, socket, stateNotification;

function createNewChannel(name, author) {
  return {
    id: Date.now(),
    creationDate: new Date().toLocaleString(),
    name: name,
    author: author,
    joined: false,
    visibility: false,
    messages: []
  };
}

function createNewMessage(message, author, typeMessage, channelId) {
  return {
    message: {
      id: Date.now(),
      author: { id: author.id, username: author.username },
      content: message,
      date: new Date().toLocaleString(),
      isNew: true,
      isNotification: typeMessage
    },
    channel: {
      id: channelId
    }
  };
}

function formatName(name) {
  let nameFormatted = name.replace(/</g, "&lt;");
  nameFormatted = nameFormatted.replace(/>/g, "&gt;");
  nameFormatted = nameFormatted.replace(/"/g, "&quot;");
  nameFormatted = nameFormatted.replace(/'/g, "&apos;");
  return nameFormatted;
}

function addChannel(name, author) {
  if (name.length == 0) return -1;

  name = formatName(name);

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
  let channelActive = "";
  app.channels.forEach((channel, index) => {
    if (index == indexChannelActive) channelActive = "active";
    else channelActive = "";
    elements += `
    <li class="${channelActive}" data-index-channel="${index}">
      <div class="channel-item">
        <svg><use xlink:href="#hashtag"></svg>
        <span class="channel-item-name">${channel.name}</span>
      </div>
      <div class="channel-item-option">
        <svg><use xlink:href="#people-plus"></svg>
        <svg><use xlink:href="#setting"></svg>
      </div>
    </li>
    `;
  });
  let channelList = document.getElementById("channels-list");
  channelList.innerHTML = elements;
  let containerScroll = channelList.parentNode.parentNode.parentNode;
  containerScroll.scrollTop = containerScroll.scrollHeight;
}

function listAllMembers() {
  let statesUsers = document.getElementsByClassName("state");
  let numUsersOnline = 0,
    numUsersOffline = 0;
  let strOnline = "",
    strOffline = "";
  let iconUserActual = "";
  app.users.forEach((user, index) => {
    if (index == 0) iconUserActual = '<svg><use xlink:href="#crown"></svg>';
    else iconUserActual = "";
    if (user.isActive) {
      numUsersOnline++;
      strOnline += `<div class="block-user">
                      <div class="user-img -block in-tab">
                        <img
                          src="https://discordapp.com/assets/0e291f67c9274a1abdddeb3fd919cbaa.png"
                          alt="user-image"
                        />
                      </div>
                      <span class="user -block">${user.username}</span>
                      ${iconUserActual}
                    </div>`;
    } else {
      numUsersOffline++;
      strOffline += `<div class="block-user offline">
                      <div class="user-img -block">
                        <img
                          src="https://discordapp.com/assets/0e291f67c9274a1abdddeb3fd919cbaa.png"
                          alt="user-image"
                        />
                      </div>
                      <span class="user -block">${user.username}</span>
                    </div>`;
    }
  });
  statesUsers[0].innerHTML = `ONLINE ${numUsersOnline}`;
  statesUsers[1].innerHTML = `OFFLINE ${numUsersOffline}`;
  document.getElementById("dvOnline").innerHTML = strOnline;
  document.getElementById("dvOffline").innerHTML = strOffline;
}

function newNotificationElement(message) {
  let styleOldIcon = "";
  if (!message.isNew) styleOldIcon = "icon-messages-old";

  return `
  <li class="container-notification -b-top">
    <svg class="${styleOldIcon}"><use xlink:href="#arrow-right"/></svg>
    <span class="group-notification">${message.content.replace(
      message.author.username,
      `<span class='user'>${message.author.username}</span>`
    )}</span>
    <span class="date">
    ${new Date(message.date).toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit"
    })}
    </span>
  </li>
  `;
}

function newMessageBlockHeader(message) {
  let styleOldIcon = "";
  if (!message.isNew) styleOldIcon = "icon-messages-old";

  return `
  <li class="container-messages -b-top">
    <div class="user-img">
      <img
        class="${styleOldIcon}"
        src="https://discordapp.com/assets/0e291f67c9274a1abdddeb3fd919cbaa.png"
        alt="user-image"
      />
    </div>
    <div class="user-messages">
      <ul>
        <li class="container-user">
          <span class="user">${message.author.username}</span>
          <span class="date">
          ${new Date(message.date).toLocaleTimeString(undefined, {
            hour: "2-digit",
            minute: "2-digit"
          })}
          </span>
        </li>
  `;
}

function newMessageBlockElement(message) {
  return `
    <li class="talk">${message.content}</li>
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
  let now = new Date();
  let today = now.getDate();
  now.setDate(today - 1);
  let yesterday = now.getDate();
  date = new Date(date);
  let dateFormatted = date.toDateString();
  if (date.getDate() == today) dateFormatted = "Today";
  else if (date.getDate() == yesterday) dateFormatted = "Yesterday";

  return `
    <li class="line">
      <span class="line-date">${dateFormatted}</span>
    </li>
  `;
}

function areDifferenteDate(newDate, previousDate) {
  return new Date(newDate).getDate() != new Date(previousDate).getDate();
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
      } else {
        let newDate = message.date;
        let previousDate = messages[index - 1].date;
        if (messages[index - 1].isNotification) {
          if (areDifferenteDate(newDate, previousDate)) {
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
          if (areDifferenteDate(newDate, previousDate)) {
            messaggesList += newDateSeparator(message.date);
          }
          messaggesList += newNotificationElement(message);
        } else if (messages[index - 1].author.id != message.author.id) {
          messaggesList += newMessageBlockFooter();
          if (areDifferenteDate(newDate, previousDate)) {
            messaggesList += newDateSeparator(message.date);
          }
          messaggesList += newMessageBlockHeader(message);
          messaggesList += newMessageBlockElement(message);
        } else {
          if (areDifferenteDate(newDate, previousDate)) {
            messaggesList += newMessageBlockFooter();
            messaggesList += newDateSeparator(message.date);
            messaggesList += newMessageBlockHeader(message);
          }
          messaggesList += newMessageBlockElement(message);
        }
      }
      message.isNew = false;
    });

    if (!arrayOfMessages[arrayOfMessages.length - 1].isNotification)
      messaggesList += newMessageBlockFooter();

    let $messagesContainer = document.getElementById("messages_container");
    $messagesContainer.innerHTML = messaggesList;
    $messagesContainer.parentNode.scrollTop =
      $messagesContainer.parentNode.scrollHeight;
  }
}

function appendNewMessage(message) {
  let $messages_container = document.getElementById("messages_container");
  let arrayOfMessages = app.channels[indexChannelActive].messages;
  let lastMessage = arrayOfMessages[arrayOfMessages.length - 1];
  let newDate = new Date(message.date);
  let previousDate = new Date(lastMessage.date);
  let $lastMessagePrinted = document.getElementById("messages_container")
    .lastElementChild;

  if (areDifferenteDate(newDate, previousDate)) {
    $messages_container.innerHTML += newDateSeparator(message.date);
  }

  if (message.isNotification) {
    $messages_container.innerHTML += newNotificationElement(message);
  } else if (
    lastMessage.isNotification ||
    message.author.id != lastMessage.author.id ||
    areDifferenteDate(newDate, previousDate) ||
    $lastMessagePrinted.firstElementChild.firstElementChild.classList.contains(
      "icon-messages-old"
    )
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
  $messages_container.parentNode.scrollTop =
    $messages_container.parentNode.scrollHeight;
  message.isNew = false;
}

function filterOwnMessages(message) {
  return !(
    message.isNotification &&
    message.author.id == app.currentuser.id &&
    message.content.indexOf("Welcome") == -1
  );
}

function modifyStateUsers(idUser, newState) {
  let indexUserFound = app.users.findIndex(user => user.id == idUser);
  app.users[indexUserFound].isActive = newState;
}

function receiveMessages(data) {
  if (filterOwnMessages(data.message)) {
    if (data.message.isNotification) {
      //There are two types of messages with property isNotification = true, to send:
      //1.- When an user is join first time
      //2.- When an user is connected after a while
      if (data.message.content.indexOf("has joint") > -1) {
        let newUserJoint = data.message.author;
        newUserJoint["isActive"] = true;
        app.users = app.users.concat(newUserJoint);
      } else modifyStateUsers(data.message.author.id, true);
    }

    let channelIndex = app.channels.findIndex(
      channel => channel.id == data.channel.id
    );
    if (indexChannelActive == channelIndex) appendNewMessage(data.message);
    else {
      if (stateNotification == "granted") {
        let title = `New messages in #${app.channels[channelIndex].name}`;
        let body = `The user ${data.message.author.username} has written`;
        const notification = sendNotificationAPI(title, body);
        notification.addEventListener("click", () =>
          changeChannel.bind(null, channelIndex)
        );
      }
    }

    app.channels[channelIndex].messages.push(data.message);
    localStorage.setItem(keyStorage, JSON.stringify(app));
    listAllMembers();

    if (!isPageVisible) {
      if (stateNotification == "granted") {
        let title = `The user ${data.message.author.username} has written`;
        let body = data.content;
        const notification = sendNotificationAPI(title, body);
        notification.addEventListener("click", () => window.focus());
      }
    }
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

function sendNotificationAPI(title, body) {
  let notification = new Notification(title, {
    body: body,
    icon: "/assets/img/discord_icon.ico",
    image: "/assets/img/discord_icon.ico"
  });
  return notification;
}

function changeChannel(channelIndex) {
  window.focus();
  let user = app.currentuser;
  let messageForAll = "";

  if (!app.channels[channelIndex].joined) {
    let messageForYouContent = "Welcome " + user.username;
    messageForAllContent = user.username + " has joined to this channel";
    app.channels[channelIndex].joined = true;
    app.channels[channelIndex].visibility = true;
    let messageForYou = createNewMessage(
      messageForYouContent,
      user,
      true,
      app.channels[channelIndex].id
    );
    app.channels[channelIndex].messages.push(messageForYou.message);
  } else messageForAllContent = user.username + " has connected";

  messageForAll = createNewMessage(
    messageForAllContent,
    user,
    true,
    app.channels[channelIndex].id
  );

  app.channels[indexChannelActive].visibility = false;
  indexChannelActive = channelIndex;
  app.channels[indexChannelActive].visibility = true;

  socket.send(JSON.stringify(messageForAll));
  localStorage.setItem(keyStorage, JSON.stringify(app));
  listAllMessages();
  let nameChannel = app.channels[indexChannelActive].name;
  document.getElementById("spnNameChannel").innerHTML = nameChannel;
  let placeholder = `Send message to #${nameChannel}`;
  document.getElementById("txtMessage").placeholder = placeholder;
}

function initializeConnection() {
  attemptConnectionSocket = 0;
  if (window.performance.navigation.type == 0) {
    if (firstConnection) {
      changeChannel(0);
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
  socket = new WebSocket("ws://localhost:3000");

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
      listAllMembers();
    } else if (data.indexOf("newChannel") > -1) {
      let receivedData = JSON.parse(data.split("|")[1]);
      if (receivedData.author.id != app.currentuser.id) {
        app.channels.push(receivedData);
        listChannels();
        if (stateNotification == "granted") {
          let title = "New channel was created";
          let body = `The name of channel is ${receivedData.name}`;
          const notification = sendNotificationAPI(title, body);

          notification.addEventListener(
            "click",
            changeChannel.bind(null, app.channels.length - 1)
          );
        }
        localStorage.setItem(keyStorage, JSON.stringify(app));
      }
    } else if (data.indexOf("usersConnected") == -1) {
      let receivedData = JSON.parse(data);
      console.log(receivedData);
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
    $error.innerHTML = `<svg><use xlink:href="#plus-circle"></svg>
                        This channel already exists`;
  } else {
    $error.innerHTML = `<svg><use xlink:href="#plus-circle"></svg>
                        Invalid channel name`;
  }
}

function handleAddMessageSubmit(event) {
  event.preventDefault();
  let $message = document.getElementById("txtMessage");
  if ($message.value.trim().length != 0) {
    $message.value = formatName($message.value.trim());
    let user = app.currentuser;
    let channelId = app.channels[indexChannelActive].id;
    let newMessage = createNewMessage($message.value, user, false, channelId);
    socket.send(JSON.stringify(newMessage));
    $message.value = "";
  }
}

function assignEvents() {
  let $formAddChannel = document.getElementById("addChannelForm");
  $formAddChannel.addEventListener("submit", handleAddChannelSubmit);

  let $formSendMessage = document.getElementById("sendMessageForm");
  $formSendMessage.addEventListener("submit", handleAddMessageSubmit);

  document.addEventListener("click", function(e) {
    if (
      e.target &&
      e.target.className.toString().includes("channel-item-name")
    ) {
      let newChannelIndex = parseInt(
        e.target.parentElement.parentElement.getAttribute("data-index-channel")
      );
      changeChannel(newChannelIndex);
      listChannels();
    }
  });

  connectionSocket();

  document.addEventListener("visibilitychange", event => {
    if (document.hidden) {
      isPageVisible = false;
    } else {
      isPageVisible = true;
    }
  });
}

window.onload = function() {
  let storedData = localStorage.getItem(keyStorage);
  if (storedData) {
    app = JSON.parse(storedData);
    indexChannelActive = app.channels.findIndex(
      channel => channel.visibility == true
    );
    let sectionInfoUser = document.getElementsByClassName("data-user")[0];
    let listChilds = sectionInfoUser.children;
    listChilds[0].innerText = app.currentuser.username;
    listChilds[1].innerText = "#" + app.currentuser.id;
    assignEvents();
    listChannels();
    listAllMessages();
    listAllMembers();
  } else {
    window.location.href = "login.html";
  }
};

window.onbeforeunload = function() {
  let userNotActive = "userDisconnected|" + app.currentuser.id;
  if (socket != null && socket.readyState == 1) {
    socket.send(userNotActive);
    socket.close();
  }
};
