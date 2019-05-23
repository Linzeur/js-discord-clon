function createNewChannel(name, author) {
  return {
    id: Date.now(),
    creationDate: new Date(),
    name: name,
    author: author,
    state: "not_joined",
    messages: []
  };
}

function addChannel(name, author) {
  if (!app.channels.some(channel => channel.name == name)) {
    let newChannel = createNewChannel(name, author);
    app.channels.push(newChannel);
    return true;
  }
  return false;
}

function listChannels() {
  let elements = "";
  app.channels.forEach(channel => {
    elements += `<li>${channel.name}</li>`;
  });
  let channelList = document.getElementById("channels_list");
  channelList.innerHTML = elements;
}

$formAddChannel.addEventListener("submit", handleAddChannelSubmit);

function handleAddChannelSubmit(event) {
  event.preventDefault();
  let $error = document.getElementById("channelError");
  $error.innerText = "";
  let $newChannelName = event.target.elements.newChannelName;
  let user = {
    id: app.currentuser.id,
    username: app.currentuser.username
  };
  if (addChannel($newChannelName.value, user)) {
    listChannels();
    $newChannelName.value = "";
  } else {
    $error.innerText = "This channel already exists";
  }
}

var $formAddChannel;

window.onload = () => {
  $formAddChannel = document.getElementById("addChannelForm");
  listChannels();
};
