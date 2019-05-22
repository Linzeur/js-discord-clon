function addChannel(name, author) {
  if (app.channels.some(channel => channel.name == name)) {
    return false;
  } else {
    let newChannel = {
      id: Date.now(),
      creationDate: new Date(),
      name: name,
      author: author,
      state: "not_joined",
      messages: []
    };
    app.channels.push(newChannel);
    return newChannel;
  }
}
