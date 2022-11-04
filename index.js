const config = {
  iceServers: [
    {
      urls: [
        'stun:stun1.l.google.com:19302',
        'stun:stun2.l.google.com:19302',
      ],
    },
  ],
  iceCandidatePoolSize: 10,
};

let localStream = null
let remoteStream = new MediaStream
let iceCandidates = []
let peerConnection = {}
let remoteOffer = {}
let remoteAnswer = {}

const localStreamElem = document.querySelector('#localStream')
const remoteStreamElem = document.querySelector('#remoteStream')
const callBtn = document.querySelector('#call')
const answerBtn = document.querySelector('#answer')

callBtn.addEventListener('click', () => call())
answerBtn.addEventListener('click', () => answer())

async function getMedia() {
  localStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true })
  localStreamElem.srcObject = localStream
  remoteStreamElem.srcObject = remoteStream
}

async function call() {
  await getMedia()
  peerConnection = new RTCPeerConnection(config)
  localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream))
  registerPeerConnectionListeners()
  const offer = await peerConnection.createOffer()
  await peerConnection.setLocalDescription(offer)
  console.log('offer', {
    type: offer.type,
    sdp: offer.sdp
  })
}

async function answer() {
  await getMedia()
  // first listen for an offer,
  // if there is an offer, then create a remote description from the answer,
  peerConnection = new RTCPeerConnection(config)
  localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream))
  registerPeerConnectionListeners()
  peerConnection.setRemoteDescription(new RTCSessionDescription(remoteOffer))

  // then...

  const answer = await peerConnection.createAnswer()
  await peerConnection.setLocalDescription(answer)

  console.log('answer', {
    type: answer.type,
    sdp: answer.sdp
  })
}

function registerPeerConnectionListeners() {
  peerConnection.addEventListener('icegatheringstatechange', ev => {
    if (peerConnection.iceGatheringState == 'complete')
      // console.log(getIceCandidatesString())
      console.log('local ice candidates', iceCandidates)
  })

  peerConnection.addEventListener('connectionstatechange', event => {
    if (peerConnection.connectionState === 'connected') {
      // Peers connected!
      console.log('peers connected!')
    }
  });

  peerConnection.addEventListener('track', ev => {
    // remoteStream = ev.streams
    ev.streams[0].getTracks().forEach(track => {
      console.log('Add a track to the remoteStream:', track);
      remoteStream.addTrack(track);
    });
  })

  // there needs to be a local stream to generate ICE candidates
  peerConnection.addEventListener('icecandidate', ev => {
    if (ev.candidate) {
      console.log(ev.candidate)
      iceCandidates.push(ev.candidate)
    }
  })
}

function addRemoteIceCandidates(iceCandidates) {
  iceCandidates.forEach(el => peerConnection.addIceCandidate(new RTCIceCandidate(el)))
}

function setRemoteAnswer(answer) {
 peerConnection.setRemoteDescription(new RTCSessionDescription(answer)) 
}