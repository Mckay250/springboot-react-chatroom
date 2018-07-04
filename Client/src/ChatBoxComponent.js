import React, { Component } from 'react';

// Material-UI 
import TextField from '@material-ui/core/TextField';
import Button from '@material-ui/core/Button';

// Styling
import './ChatBox.css';

// Default user image
import userImage from './userImage.png';

var stompClient = null;

export default class ChatBoxComponent extends Component {
  constructor(props) {
    super(props);
    this.state =
      {
        username: '',
        channelConnected: false,
        chatMessage: '',
        roomNotification: [],
        broadcastMessage: [],
        error: '',
        bottom: false,
        curTime: ''
      };
  }

  connect = (event) => {

    if (this.state.username) {

      const Stomp = require('stompjs')

      var SockJS = require('sockjs-client')

      SockJS = new SockJS('/ws')

      stompClient = Stomp.over(SockJS);

      stompClient.connect({}, this.onConnected, this.onError);

    }
  }

  onConnected = () => {
    
    this.setState({
      channelConnected: true
    })

    // Subscribing to the public topic
    stompClient.subscribe('/topic/public', this.onMessageReceived);

    // Registering user to server
    stompClient.send("/app/addUser",
      {},
      JSON.stringify({ sender: this.state.username, type: 'JOIN' })
    )
  }

  onError = (error) => {
    this.setState({
      error: 'Could not connect you to the Chat Room Server. Please refresh this page and try again!'
    })
  }

  sendMessage = (event) => {

    if (stompClient) {
      var chatMessage = {
        sender: this.state.username,
        content: this.state.chatMessage,
        type: 'CHAT'
      };

      stompClient.send("/app/sendMessage", {}, JSON.stringify(chatMessage));

      // clear message text box after sending the message
      this.setState({
        chatMessage: ''
      })

    }
  }

  onMessageReceived = (payload) => {
    var message = JSON.parse(payload.body);

    if (message.type === 'JOIN') {

      this.state.roomNotification.push({ 'sender': message.sender + " ~ joined!", 'status': 'online' })

      this.setState({
        roomNotification: this.state.roomNotification
      })
    } else if (message.type === 'LEAVE') {

      this.state.roomNotification.push({ 'sender': message.sender + " ~ left!", 'status': 'offline' })

      this.setState({
        roomNotification: this.state.roomNotification
      })
    } else {
      this.state.broadcastMessage.push({
        message: message.content,
        sender: message.sender
      })

      this.setState({
        broadcastMessage: this.state.broadcastMessage
      })
    }
  }

  handleChange = (event) => {
    this.setState({
      username: event.target.value,
    });
  };

  handleChatMSGChange = (event) => {
    this.setState({
      chatMessage: event.target.value,
    });
  };

  scrollToBottom = () => {
    //  window.scrollTo(0, document.body.scrollHeight);
    var object = this.refs.messageBox;
    object.scrollTop = object.scrollHeight;
  }

  // getRandomColor = () => {
  //   var letters = '0123456789ABCDEF';
  //   var color = '#';
  //   for (var i = 0; i < 6; i++) {
  //     color += letters[Math.floor(Math.random() * 16)];
  //   }
  //   return color;
  // }

  errorStyle = {
    color: 'red'
  }

  componentDidMount() {
    this.setState({
      curTime: new Date().toLocaleString()
    })

  }
  render() {

    return (
      this.state.error ? <span style={this.errorStyle}>{this.state.error}</span> :
        <div id="container">

          {this.state.channelConnected ?
            (
              <aside>
                <header>
                  <input type="text" placeholder="search" />
                </header>
                <ul >
                  {this.state.roomNotification.map((notification, i) =>
                    <li key={i}>
                      <img src={userImage} alt="Default-User" id="userImage" />
                      <div>
                        <h2>{notification.sender}</h2>
                        <h3>
                          {notification.status === 'online' ? <span className="status green"></span> : <span className="status orange"></span>}
                          {notification.status}
                        </h3>
                      </div>
                    </li>
                  )} </ul> </aside>
            ) : (
              <div>
                <TextField
                  id="user"
                  label="Type your username"
                  placeholder="Username"
                  onChange={this.handleChange}
                  margin="normal"
                />
                <br />
                <Button variant="contained" color="primary" onClick={this.connect} >
                  Start Chatting
             </Button>
              </div>)
          }

          {
            <main>
              {this.state.channelConnected ?
                <div>
                  <header>
                    <div>
                      <h2>Welcome {this.state.username}<span className="status green"></span></h2>
                      <h3>You have total {this.state.broadcastMessage.length} messages</h3>
                    </div>
                  </header>
                  <ul id="chat" ref="messageBox">
                    {this.state.broadcastMessage.map((msg, i) =>
                      this.state.username === msg.sender ?
                        <li className="you" key={i}>
                          <div className="entete">
                            <h2>{msg.sender} ~ (You)</h2>
                            <h3>{this.state.curTime}</h3>
                            <span className="status green"></span>
                          </div>
                          <div className="triangle"></div>
                          <div className="message">
                            {msg.message}
                          </div>
                        </li>
                        :
                        <li className="others">
                          <div className="entete">
                            <span className="status blue"></span>
                            <h2>{msg.sender}</h2>
                            <h3>10:12AM, Today</h3>
                          </div>
                          <div className="triangle"></div>
                          <div className="message">
                            {msg.message}
                          </div>
                        </li>
                    )}
                  </ul>
                  <footer>
                    <TextField
                      id="msg"
                      label="Type your message here..."
                      placeholder="Press enter to send"
                      onChange={this.handleChatMSGChange}
                      margin="normal"
                      value={this.state.chatMessage}
                      onKeyPress={event => {
                        if (event.key === 'Enter') {
                          this.sendMessage();
                          this.scrollToBottom();
                        }
                      }}
                    />
                  </footer>

                </div>
                : ""}
            </main>
          }
          <br />
          {this.state.channelConnected ?
            <div>
              <TextField
                id="msg"
                label="Press enter to send"
                placeholder="Write your message here..."
                onChange={this.handleChatMSGChange}
                margin="normal"
                value={this.state.chatMessage}
                onKeyPress={event => {
                  if (event.key === 'Enter') {
                    this.sendMessage();
                    //  this.scrollToBottom();
                  }
                }}
              />
            </div>
            : ""}
        </div>
    )
  }
}