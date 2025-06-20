const startCallBtn = document.getElementById('startCall');
const hangUpBtn = document.getElementById('hangUp');
const remoteAudio = document.getElementById('remoteAudio');

let localStream;
let peerConnection;
const socket = new WebSocket('ws://localhost:3000');

const config = {
  iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
};

socket.onmessage = async ({ data }) => {
  const message = JSON.parse(data);
  if (message.offer) {
    await createAnswer(message.offer);
  } else if (message.answer) {
    await peerConnection.setRemoteDescription(new RTCSessionDescription(message.answer));
  } else if (message.iceCandidate) {
    try {
      await peerConnection.addIceCandidate(message.iceCandidate);
    } catch (e) {
      console.error('Error adding received ice candidate', e);
    }
  }
};

startCallBtn.onclick = async () => {
  localStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });

  peerConnection = new RTCPeerConnection(config);

  localStream.getTracks().forEach(track => {
    peerConnection.addTrack(track, localStream);
  });

  peerConnection.onicecandidate = event => {
    if (event.candidate) {
      socket.send(JSON.stringify({ iceCandidate: event.candidate }));
    }
  };

  peerConnection.ontrack = event => {
    remoteAudio.srcObject = event.streams[0];
  };

  const offer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offer);
  socket.send(JSON.stringify({ offer }));
};

async function createAnswer(offer) {
  peerConnection = new RTCPeerConnection(config);

  peerConnection.onicecandidate = event => {
    if (event.candidate) {
      socket.send(JSON.stringify({ iceCandidate: event.candidate }));
    }
  };

  peerConnection.ontrack = event => {
    remoteAudio.srcObject = event.streams[0];
  };

  localStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
  localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));

  await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
  const answer = await peerConnection.createAnswer();
  await peerConnection.setLocalDescription(answer);
  socket.send(JSON.stringify({ answer }));
}

hangUpBtn.onclick = () => {
  if (peerConnection) {
    peerConnection.close();
    peerConnection = null;
  }
};
