var app = {
  currentuser: {
    id: 1,
    username: "admin",
    creationDate: new Date("2019-05-15T07:00"),
    state: "active"
  },
  users: [
    {
      id: 1,
      username: "admin",
      state: "active"
    },
    {
      id: 2,
      username: "user2",
      state: "active"
    },
    {
      id: 3,
      username: "user3",
      state: "active"
    },
    {
      id: 4,
      username: "user4",
      state: "active"
    }
  ],
  channels: [
    {
      id: 1,
      creationDate: new Date("2019-05-20T07:00"),
      name: "general",
      author: { id: 1, username: "admin" },
      state: "joined",
      messages: [
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
          author: { id: 2, username: "user2" },
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
          author: { id: 4, username: "admin" },
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
      ]
    },
    {
      id: 2,
      creationDate: new Date("2019-05-21T00:00"),
      name: "channel2",
      author: { id: 2, username: "user2" },
      state: "joined",
      messages: [
        {
          id: 6,
          author: { id: 2, username: "user2" },
          content: "Hi, I have created this channel as a test",
          date: new Date("2019-05-21T14:30"),
          state: "new"
        },
        {
          id: 7,
          author: { id: 4, username: "user4" },
          content: "Hi, nice to meet you, my name is user4",
          date: new Date("2019-05-21T14:33"),
          state: "new"
        }
      ]
    },
    {
      id: 3,
      creationDate: new Date("2019-05-21T01:00"),
      name: "channel3",
      author: { id: 3, username: "user3" },
      state: "not_joined",
      messages: []
    }
  ]
};
