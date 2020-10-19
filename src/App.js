import React from 'react';
import logo from './logo.svg';
import './App.css';

function App() {
  const localVideo = document.getElementById("local-video")
  const remoteVideo = document.getElementById("remote-video")
  const sizeTag = document.getElementById("size-tag")
  const brTag = document.getElementById("br-tag")
  let simulcast = false

  remoteVideo.addEventListener('loadedmetadata', function () {
    sizeTag.innerHTML = `${remoteVideo.videoWidth}x${remoteVideo.videoHeight}`
  });

  remoteVideo.onresize = function () {
    sizeTag.innerHTML = `${remoteVideo.videoWidth}x${remoteVideo.videoHeight}`
  };

  /* eslint-env browser */
  const log = msg =>
      document.getElementById('local-logs').innerHTML += msg + '<br>'
  const echoLog = msg =>
      document.getElementById('echo-logs').innerHTML += "echo: "+msg + '<br>'


  const joinBtns = document.getElementById("start-btns")

  const config = {
    iceServers: [{
      urls: 'turn:conectar.demo.forasoft.com?transport=tcp',
      username: 'conectar',
      credential: 'ZVp1NaagEN7r'
    }, {
      urls: 'stun:stun.l.google.com:19302'
    }]
  }

  const socket = new WebSocket("ws://18.195.79.21:7000/ws");

  const echoSocket = new WebSocket("ws://18.195.79.21:7000/ws");
  const pc = new RTCPeerConnection(config)
  const epc = new RTCPeerConnection(config)

  // socket.addEventListener('message', async (event) => {
  //     const resp = JSON.parse(event.data)
  //     // Listen for server renegotiation notifications
  //     if (!resp.id && resp.method === "offer") {
  //         log(`Got offer notification`)
  //         await pc.setRemoteDescription(resp.params)
  //         const answer = await pc.createAnswer()
  //         await pc.setLocalDescription(answer)
  //
  //         const id = Math.random().toString()
  //         log(`Sending answer`)
  //         socket.send(JSON.stringify({
  //             method: "answer",
  //             params: { desc: answer },
  //             id
  //         }))
  //     } else if (resp.method === "trickle") {
  //         pc.addIceCandidate(resp.params).catch(log);
  //     }
  // })

  socket.onopen = () => {
    console.log('CONNECTED');
  }
  echoSocket.onopen = () => {
    console.log('ECHO CONNECTED');
  }

  pc.oniceconnectionstatechange = () => log(`ICE connection state: ${pc.iceConnectionState}`)

  pc.onicecandidate = event => {

    if (event.candidate !== null) {
      console.log('signal');
      socket.send(JSON.stringify({
        method: "trickle",
        params: {
          candidate: event.candidate,
        }
      }))
    }
  }

  socket.addEventListener('message', async (event) => {
    const resp = JSON.parse(event.data)
    // Listen for server renegotiation notifications
    if (!resp.id && resp.method === "offer") {
      log(`Got offer notification`)
      await pc.setRemoteDescription(resp.params)
      const answer = await pc.createAnswer()
      await pc.setLocalDescription(answer)

      const id = Math.random().toString()
      log(`Sending answer`)
      socket.send(JSON.stringify({
        method: "answer",
        params: {
          desc: answer
        },
        id
      }))
    } else if (resp.method === "trickle") {
      pc.addIceCandidate(resp.params).catch(log);
    }
  })

  const join = async () => {
    joinBtns.style.display = 'none';
    const offer = await pc.createOffer()
    await pc.setLocalDescription(offer)
    const id = Math.random().toString()
    console.log(offer)


    socket.send(JSON.stringify({
      method: "join",
      params: {
        sid: "test room",
        offer: pc.localDescription
      },
      id
    }))

    socket.addEventListener('message', (event) => {
      const resp = JSON.parse(event.data)
      if (resp.id === id) {
        log(`Got publish answer`)
        // Hook this here so it's not called before joining
        pc.onnegotiationneeded = async function () {
          log("Renegotiating")
          const offer = await pc.createOffer()
          await pc.setLocalDescription(offer)
          const id = Math.random().toString()
          socket.send(JSON.stringify({
            method: "offer",
            params: {
              desc: offer
            },
            id
          }))

          socket.addEventListener('message', (event) => {
            const resp = JSON.parse(event.data)
            if (resp.id === id) {
              log(`Got renegotiation answer`)
              pc.setRemoteDescription(resp.result)
            }
          })
        }
        console.log(resp.result)
        pc.setRemoteDescription(resp.result)
        setTimeout(() => startEcho(), 500)
      }
    })
  }

  const add = () => {
    pc.addTrack(localStream.getAudioTracks()[0], localStream)
  }

  const start = (sc) => {
    simulcast = sc
    navigator.mediaDevices.getUserMedia({
      video: {
        width: { min: 1024, ideal: 1280, max: 1920 },
        height: { min: 576, ideal: 720, max: 1080 },
        frameRate: {
          ideal: 30,
          max: 60
        }
      },
      audio: true
    }).then(stream => {
      localVideo.srcObject = stream
      localVideo.autoplay = true
      localVideo.controls = true
      localVideo.muted = true
      localStream = stream


      log("Publishing stream")
      if (simulcast) {
        pc.addTransceiver(localStream.getVideoTracks()[0], {
          streams: [localStream],
          direction: 'sendonly',
          sendEncodings: [{
            rid: 'f',
          },
            {
              rid: 'h',
              scaleResolutionDownBy: 2.0,
              maxBitrate: 150000
            },
            {
              rid: 'q',
              scaleResolutionDownBy: 4.0,
              maxBitrate: 100000
            },

          ]
        });
        pc.addTrack(stream.getAudioTracks()[0], localStream)
      } else {
        localStream.getTracks().forEach((track) => {
          log("add track")
          pc.addTrack(track, localStream);
        });
      }
      join()
    }).catch(log)
  }

  let localStream
  let remoteStream
  let pid

  // remote
  let sendChannel = epc.createDataChannel('ion-sfu')
  sendChannel.onclose = () => echoLog('sendChannel has closed')
  sendChannel.onopen = () => {
    echoLog('sendChannel has opened');
  }
  sendChannel.onmessage = e => echoLog(`Message from DataChannel '${sendChannel.label}' payload '${e.data}'`)


  const api = {
    streamId: "",
    video: "high",
    audio: true,
  }

  const controlVideo = (radio) => {
    api.video = radio.value
    const str = JSON.stringify(api, null, 2);
    sendChannel.send(str)
    document.getElementById("api").innerHTML = syntaxHighlight(str)
  }

  const controlAudio = (radio) => {
    api.audio = radio.value === "true"
    const str = JSON.stringify(api, null, 2);
    sendChannel.send(str)
    document.getElementById("api").innerHTML = syntaxHighlight(str)
  }

  function syntaxHighlight(json) {
    json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
      let cls = 'number';
      if (/^"/.test(match)) {
        if (/:$/.test(match)) {
          cls = 'key';
        } else {
          cls = 'string';
        }
      } else if (/true|false/.test(match)) {
        cls = 'boolean';
      } else if (/null/.test(match)) {
        cls = 'null';
      }
      return '<span class="' + cls + '">' + match + '</span>';
    });
  }

  const getStats = () => {
    let bytesPrev;
    let timestampPrev;
    setInterval(() => {
      epc.getStats(null).then(results => {
        results.forEach(report => {
          const now = report.timestamp;

          let bitrate;
          if (report.type === 'inbound-rtp' && report.mediaType === 'video') {
            const bytes = report.bytesReceived;
            if (timestampPrev) {
              bitrate = 8 * (bytes - bytesPrev) / (now - timestampPrev);
              bitrate = Math.floor(bitrate);
            }
            bytesPrev = bytes;
            timestampPrev = now;
          }
          if (bitrate) {
            brTag.innerHTML = `${bitrate} kbps`;
          }
        });
      })
    }, 1000)
  }

  epc.ontrack = function ({
                            track,
                            streams
                          }) {
    echoLog("Got remote track")
    if (remoteStream === undefined) {
      getStats()
      remoteStream = streams[0]
      remoteVideo.srcObject = remoteStream
      remoteVideo.autoplay = true
      api.streamId = remoteStream.id
      const str = JSON.stringify(api, null, 2);
      document.getElementById("api").innerHTML = syntaxHighlight(str)
    }
  }

  epc.oniceconnectionstatechange = () => echoLog(`ICE connection state2: ${epc.iceConnectionState}`)

  epc.onicecandidate = event => {
    if (event.candidate !== null) {
      echoSocket.send(JSON.stringify({
        method: "trickle",
        params: {
          candidate: event.candidate,
        }
      }))
    }
  }

  echoSocket.addEventListener('message', async (event) => {
    const resp = JSON.parse(event.data)

    // Listen for server renegotiation notifications
    if (!resp.id && resp.method === "offer") {
      echoLog(`Got offer notification`)
      await epc.setRemoteDescription(resp.params)
      const answer = await epc.createAnswer()
      await epc.setLocalDescription(answer)

      const id = Math.random().toString()
      echoLog(`Sending answer`)
      echoSocket.send(JSON.stringify({
        method: "answer",
        params: {
          desc: answer
        },
        id
      }))
    } else if (resp.method === "trickle") {
      epc.addIceCandidate(resp.params).catch(echoLog);
    }
  })

  const joinEcho = async () => {
    const offer = await epc.createOffer()
    await epc.setLocalDescription(offer)
    const id = Math.random().toString()
    console.log(offer)

    echoSocket.send(JSON.stringify({
      method: "join",
      params: {
        sid: "test room",
        offer: epc.localDescription
      },
      id
    }))


    echoSocket.addEventListener('message', (event) => {
      const resp = JSON.parse(event.data)
      if (resp.id === id) {
        echoLog(`Got publish answer2`)

        // Hook this here so it's not called before joining
        epc.onnegotiationneeded = async function () {
          echoLog("Renegotiating")
          const offer = await epc.createOffer()
          await epc.setLocalDescription(offer)
          const id = Math.random.toString()
          echoSocket.send(JSON.stringify({
            method: "offer",
            params: {
              desc: offer
            },
            id
          }))

          echoSocket.addEventListener('message', (event) => {
            const resp = JSON.parse(event.data)
            if (resp.id === id) {
              echoLog(`Got renegotiation answer`)
              epc.setRemoteDescription(resp.result)
            }
          })
        }
        console.log(resp)
        epc.setRemoteDescription(resp.result)
        document.getElementById("controls").style.display = "flex";
        if (simulcast) {
          document.getElementById("simulcast-controls").style.display = "block";
        } else {
          document.getElementById("simple-controls").style.display = "block";
        }
      }
    })

  }

  const startEcho = () => {
    epc.addTransceiver("video", {
      direction: "recvonly"
    })
    epc.addTransceiver("audio", {
      direction: "recvonly"
    })
    joinEcho()
  }

  return (
    <div className="App">
      <header className="App-header">
        <nav className="navbar navbar-light bg-light border-bottom">
          <h3>Pion</h3>
        </nav>
        <div className="container pt-4">
          <div className="row" id="start-btns">
            <div className="col-12">
              <button type="button" className="btn btn-primary" onClick="start(false)">start</button>
              <button type="button" className="btn btn-primary" onClick="start(true)">start with simulcast</button>
            </div>
          </div>
          <div className="row pt-3" id="controls" style={{display: 'none'}}>
            <div className="col-3">
              <strong>Video</strong>
              <div id="simulcast-controls" style={{display: 'none'}}>
                <div className="radio">
                  <label><input type="radio" onClick="controlVideo(this)" value="high" name="optvideos" checked></input>
                    High</label>
                </div>
                <div className="radio">
                  <label><input type="radio" onClick="controlVideo(this)" value="medium" name="optvideos"></input>
                    Medium</label>
                </div>
                <div className="radio">
                  <label><input type="radio" onClick="controlVideo(this)" value="low" name="optvideos"></input>
                    Low</label>
                </div>
                <div className="radio">
                  <label><input type="radio" onClick="controlVideo(this)" value="none" name="optvideos"></input>
                    Mute</label>
                </div>
              </div>

              <div id="simple-controls" style={{display: 'none'}}>
                <div className="radio">
                  <label><input type="radio" onClick="controlVideo(this)" value="high" name="optvideo" checked></input>
                    Unmute</label>
                </div>
                <div className="radio">
                  <label><input type="radio" onClick="controlVideo(this)" value="none" name="optvideo"></input>
                    Mute</label>
                </div>
              </div>

            </div>
            <div className="col-3">
              <strong>Audio</strong>
              <div className="radio">
                <label><input type="radio" onClick="controlAudio(this)" value="true" name="optaudio" checked></input>
                  Unmute</label>
              </div>
              <div className="radio">
                <label><input type="radio" onClick="controlAudio(this)" value="false" name="optaudio"></input> Mute</label>
              </div>
            </div>
            <div className="col-6">
              <strong>API call</strong>
              <pre id="api" className="d-block border" style={{backgroundColor: '#f8f9fa',height:'117px'}}></pre>
            </div>
          </div>
          <div className="row">
            <div className="col-6 pt-2">
                <span style={{position: 'absolute',marginLeft: '5px',marginTop: '5px'}}
                      className="badge badge-primary">Local</span>
              <video id="local-video" style={{backgroundColor: 'black'}} width="320" height="240"></video>
              <strong className="d-block">Local logs:</strong>
              <div id="local-logs" className="mt-2 d-block" style={{backgroundColor: '#f8f9fa'}}></div>
            </div>
            <div className="col-6 pt-2">
                <span style={{position: 'absolute',marginLeft: '5px',marginTop: '5px'}}
                      className="badge badge-primary">Remote</span>
              <span id="size-tag" style={{position: 'absolute',marginLeft: '5px',top: '225px'}}
                    className="badge badge-primary"></span>
              <span id="br-tag" style={{position: 'absolute',left: '270px',top: '225px'}}
                    className="badge badge-primary"></span>
              <video id="remote-video" style={{backgroundColor: 'black'}} width="320" height="240"></video>
              <strong className="d-block">Echo logs:</strong>
              <div id="echo-logs" className="mt-2 d-block" style={{backgroundColor: '#f8f9fa'}}></div>
            </div>

          </div>
        </div>
      </header>
    </div>
  );
}

export default App;
