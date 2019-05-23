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
    return newChannel;
  }
  return false;
}
