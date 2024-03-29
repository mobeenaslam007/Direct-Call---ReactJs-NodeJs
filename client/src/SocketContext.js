import React, { createContext, useState, useRef, useEffect } from "react";
import io from "socket.io-client";
import Peer from "simple-peer";

console.log("---------", io);

const SocketContext = createContext();
// let phoneNumber = null;
// while (phoneNumber === null) phoneNumber = prompt("Enter your phone number");
const phoneNumber = "03453626915";

const socket = io("https://wgroup-direct-call.herokuapp.com/", {
    query: `CustomId=${phoneNumber}`,
  });

// const socket = io("https://call.watchblock.net", {
//   query: `CustomId=${phoneNumber}`,
// });
// const socket = io("http://localhost:7000", {
//   query: `CustomId=${phoneNumber}`,
// });

const ContextProvider = ({ children }) => {
  const [callAccepted, setCallAccepted] = useState(false);
  const [callEnded, setCallEnded] = useState(false);
  const [stream, setStream] = useState();
  const [name, setName] = useState("");
  const [call, setCall] = useState({});
  const [me, setMe] = useState("");

  const myVideo = useRef();
  const userVideo = useRef();
  const connectionRef = useRef();

  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((currentStream) => {
        setStream(currentStream);

        myVideo.current.srcObject = currentStream;
      });

    socket.on("me", (id) => {
      setMe(id);
      console.log(id);
    });
    // setMe("03453626917")

    socket.on("callUser", ({ from, name: callerName, signal }) => {
      // console.log({ from, name: callerName, signal })
      // debugger;
      setCall({ isReceivingCall: true, from, name: callerName, signal });
    });

  }, []);

  const answerCall = () => {
    setCallAccepted(true);

    const peer = new Peer({ initiator: false, trickle: false, stream });

    peer.on("signal", (data) => {
      socket.emit("answerCall", { signal: data, to: call.from });
    });

    peer.on("stream", (currentStream) => {
      userVideo.current.srcObject = currentStream;
    });

    peer.signal(call.signal);

    connectionRef.current = peer;
  };

  const callUser = (id) => {
    const peer = new Peer({ initiator: true, trickle: false, stream });
    peer.on("signal", (data) => {
      socket.emit("callUser", {
        userToCall: id,
        signalData: data,
        from: me,
        name,
      });
    });

    peer.on("stream", (currentStream) => {
      userVideo.current.srcObject = currentStream;
    });

    socket.on("callAccepted", (signal) => {
      setCallAccepted(true);

      peer.signal(signal);
    });

    // socket.on("callEnded", () => {
    // setCallEnded(true);
    // connectionRef.current.destroy();

    // window.location.reload();
      
    // });

    connectionRef.current = peer;
  };

  const leaveCall = () => {
    setCallEnded(true);

    connectionRef.current.destroy();

    window.location.reload();
  };

  return (
    <SocketContext.Provider
      value={{
        call,
        callAccepted,
        myVideo,
        userVideo,
        stream,
        name,
        setName,
        callEnded,
        me,
        callUser,
        leaveCall,
        answerCall,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export { ContextProvider, SocketContext };
