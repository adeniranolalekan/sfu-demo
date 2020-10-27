// import React from 'react';
// import logo from './logo.svg';
// import './App.css';
//
// let localLogs = '',
//   echoLogs = '';
//
// /* eslint-env browser */
// const log = (msg) => {
//   localLogs += `${msg} </br>`;
// };
//
// const echoLog = (msg) => {
//   echoLogs += `${msg} </br>`;
// };
//
// const config = {
//   iceServers: [
//     {
//       urls: 'turn:conectar.demo.forasoft.com?transport=tcp',
//       username: 'conectar',
//       credential: 'ZVp1NaagEN7r',
//     },
//     {
//       urls: 'stun:stun.l.google.com:19302',
//     },
//   ],
// };
//
// const socket = new WebSocket('ws://18.195.79.21:7000/ws');
// const echoSocket = new WebSocket('ws://18.195.79.21:7000/ws');
// const pc = new RTCPeerConnection(config);
// const epc = new RTCPeerConnection(config);
// let localVideo;
// let remoteVideo;
// let simulcast = false;
//
// socket.onopen = () => {
//   console.log('CONNECTED');
// };
// echoSocket.onopen = () => {
//   console.log('ECHO CONNECTED');
// };
//
// pc.oniceconnectionstatechange = () =>
//   log(`ICE connection state: ${pc.iceConnectionState}`);
//
// pc.onicecandidate = (event) => {
//   if (event.candidate !== null) {
//     console.log('signal');
//     socket.send(
//       JSON.stringify({
//         method: 'trickle',
//         params: {
//           candidate: event.candidate,
//         },
//       })
//     );
//   }
// };
//
// socket.addEventListener('message', async (event) => {
//   const resp = JSON.parse(event.data);
//   // Listen for server renegotiation notifications
//   if (!resp.id && resp.method === 'offer') {
//     log(`Got offer notification`);
//     await pc.setRemoteDescription(resp.params);
//     const answer = await pc.createAnswer();
//     await pc.setLocalDescription(answer);
//
//     const id = Math.random().toString();
//     log(`Sending answer`);
//     socket.send(
//       JSON.stringify({
//         method: 'answer',
//         params: {
//           desc: answer,
//         },
//         id,
//       })
//     );
//   } else if (resp.method === 'trickle') {
//     pc.addIceCandidate(resp.params).catch(log);
//   }
// });
//
// function syntaxHighlight(json) {
//   json = json
//     .replace(/&/g, '&amp;')
//     .replace(/</g, '&lt;')
//     .replace(/>/g, '&gt;');
//   return json.replace(
//     /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
//     function (match) {
//       let cls = 'number';
//       if (/^"/.test(match)) {
//         if (/:$/.test(match)) {
//           cls = 'key';
//         } else {
//           cls = 'string';
//         }
//       } else if (/true|false/.test(match)) {
//         cls = 'boolean';
//       } else if (/null/.test(match)) {
//         cls = 'null';
//       }
//       return '<span class="' + cls + '">' + match + '</span>';
//     }
//   );
// }
//
// const startEcho = () => {
//   epc.addTransceiver('video', {
//     direction: 'recvonly',
//   });
//   epc.addTransceiver('audio', {
//     direction: 'recvonly',
//   });
//   joinEcho();
// };
//
// const add = () => {
//   pc.addTrack(localStream.getAudioTracks()[0], localStream);
// };
//
// let localStream;
// let remoteStream;
// let pid;
//
// // remote
// let sendChannel = epc.createDataChannel('ion-sfu');
// sendChannel.onclose = () => echoLog('sendChannel has closed');
// sendChannel.onopen = () => {
//   echoLog('sendChannel has opened');
// };
// sendChannel.onmessage = (e) =>
//   echoLog(
//     `Message from DataChannel '${sendChannel.label}' payload '${e.data}'`
//   );
//
// const api = {
//   streamId: '',
//   video: 'high',
//   audio: true,
// };
//
// epc.oniceconnectionstatechange = () =>
//   echoLog(`ICE connection state2: ${epc.iceConnectionState}`);
//
// epc.onicecandidate = (event) => {
//   if (event.candidate !== null) {
//     echoSocket.send(
//       JSON.stringify({
//         method: 'trickle',
//         params: {
//           candidate: event.candidate,
//         },
//       })
//     );
//   }
// };
//
// const handleJoin = async () => {
//   const offer = await pc.createOffer();
//   await pc.setLocalDescription(offer);
//   const id = Math.random().toString();
//   console.log(offer);
//
//   socket.send(
//     JSON.stringify({
//       method: 'join',
//       params: {
//         sid: 'test room',
//         offer: pc.localDescription,
//       },
//       id,
//     })
//   );
//
//   socket.addEventListener('message', (event) => {
//     const resp = JSON.parse(event.data);
//     if (resp.id === id) {
//       log(`Got publish answer`);
//       // Hook this here so it's not called before joining
//       pc.onnegotiationneeded = async function () {
//         log('Renegotiating');
//         const offer = await pc.createOffer();
//         await pc.setLocalDescription(offer);
//         const id = Math.random().toString();
//         socket.send(
//           JSON.stringify({
//             method: 'offer',
//             params: {
//               desc: offer,
//             },
//             id,
//           })
//         );
//
//         socket.addEventListener('message', (event) => {
//           const resp = JSON.parse(event.data);
//           if (resp.id === id) {
//             log(`Got renegotiation answer`);
//             pc.setRemoteDescription(resp.result);
//           }
//         });
//       };
//       console.log(resp.result);
//       pc.setRemoteDescription(resp.result);
//       setTimeout(() => startEcho(), 500);
//     }
//   });
// };
//
// echoSocket.addEventListener('message', async (event) => {
//   const resp = JSON.parse(event.data);
//
//   // Listen for server renegotiation notifications
//   if (!resp.id && resp.method === 'offer') {
//     echoLog(`Got offer notification`);
//     await epc.setRemoteDescription(resp.params);
//     const answer = await epc.createAnswer();
//     await epc.setLocalDescription(answer);
//
//     const id = Math.random().toString();
//     echoLog(`Sending answer`);
//     echoSocket.send(
//       JSON.stringify({
//         method: 'answer',
//         params: {
//           desc: answer,
//         },
//         id,
//       })
//     );
//   } else if (resp.method === 'trickle') {
//     epc.addIceCandidate(resp.params).catch(echoLog);
//   }
// });
//
// const joinEcho = async () => {
//   const offer = await epc.createOffer();
//   await epc.setLocalDescription(offer);
//   const id = Math.random().toString();
//   console.log(offer);
//
//   echoSocket.send(
//     JSON.stringify({
//       method: 'join',
//       params: {
//         sid: 'test room',
//         offer: epc.localDescription,
//       },
//       id,
//     })
//   );
//
//   echoSocket.addEventListener('message', (event) => {
//     const resp = JSON.parse(event.data);
//     if (resp.id === id) {
//       echoLog(`Got publish answer2`);
//
//       // Hook this here so it's not called before joining
//       epc.onnegotiationneeded = async function () {
//         echoLog('Renegotiating');
//         const offer = await epc.createOffer();
//         await epc.setLocalDescription(offer);
//         const id = Math.random.toString();
//         echoSocket.send(
//           JSON.stringify({
//             method: 'offer',
//             params: {
//               desc: offer,
//             },
//             id,
//           })
//         );
//
//         echoSocket.addEventListener('message', (event) => {
//           const resp = JSON.parse(event.data);
//           if (resp.id === id) {
//             echoLog(`Got renegotiation answer`);
//             epc.setRemoteDescription(resp.result);
//           }
//         });
//       };
//       console.log(resp);
//       epc.setRemoteDescription(resp.result);
//       document.getElementById('controls').style.display = 'flex';
//       if (simulcast) {
//         document.getElementById('simulcast-controls').style.display = 'block';
//       } else {
//         document.getElementById('simple-controls').style.display = 'block';
//       }
//     }
//   });
// };
//
// function App() {
//   const [brTag, setBrTag] = React.useState('');
//   const [apiValue, setApi] = React.useState('');
//   const [sizeTag, setSizeTag] = React.useState(0);
//   const [joining, setJoining] = React.useState(false);
//   const [videoSettings, SVS] = React.useState('high');
//   const [audioSettings, SAS] = React.useState(true);
//   const [streamArray, setStreamArray]=React.useState([])
//
//   const join = () => {
//     setJoining(true);
//     handleJoin();
//   };
//
//   const setVideoSettings = (value) => () => SVS(value);
//   const setAudioSettings = (value) => () => SAS(value);
//
//   const getStats = () => {
//     let bytesPrev;
//     let timestampPrev;
//     setInterval(() => {
//       epc.getStats(null).then((results) => {
//         results.forEach((report) => {
//           const now = report.timestamp;
//
//           let bitrate;
//           if (report.type === 'inbound-rtp' && report.mediaType === 'video') {
//             const bytes = report.bytesReceived;
//             if (timestampPrev) {
//               bitrate = (8 * (bytes - bytesPrev)) / (now - timestampPrev);
//               bitrate = Math.floor(bitrate);
//             }
//             bytesPrev = bytes;
//             timestampPrev = now;
//           }
//           if (bitrate) {
//             setBrTag(`${bitrate} kbps`);
//           }
//         });
//       });
//     }, 1000);
//   };
//
//   React.useEffect(() => {
//     if (sendChannel.readyState === 'open') {
//       api.video = videoSettings;
//       const str = JSON.stringify(api, null, 2);
//       sendChannel.send(str);
//       setApi(syntaxHighlight(str));
//     }
//   }, [videoSettings]);
//
//   React.useEffect(() => {
//     if (sendChannel.readyState === 'open') {
//       api.audio = audioSettings;
//       const str = JSON.stringify(api, null, 2);
//       sendChannel.send(str);
//       setApi(syntaxHighlight(str));
//     }
//   }, [audioSettings]);
//
//   const start = (sc) => {
//     simulcast = sc;
//     navigator.mediaDevices
//       .getUserMedia({
//         video: {
//           width: { min: 1024, ideal: 1280, max: 1920 },
//           height: { min: 576, ideal: 720, max: 1080 },
//           frameRate: {
//             ideal: 30,
//             max: 60,
//           },
//         },
//         audio: true,
//       })
//       .then((stream) => {
//         localVideo.srcObject = stream;
//         localVideo.autoplay = true;
//         localVideo.controls = true;
//         localVideo.muted = true;
//         localStream = stream;
//
//         log('Publishing stream');
//         if (simulcast) {
//           pc.addTransceiver(localStream.getVideoTracks()[0], {
//             streams: [localStream],
//             direction: 'sendonly',
//             sendEncodings: [
//               {
//                 rid: 'f',
//               },
//               {
//                 rid: 'h',
//                 scaleResolutionDownBy: 2.0,
//                 maxBitrate: 150000,
//               },
//               {
//                 rid: 'q',
//                 scaleResolutionDownBy: 4.0,
//                 maxBitrate: 100000,
//               },
//             ],
//           });
//           pc.addTrack(stream.getAudioTracks()[0], localStream);
//         } else {
//           localStream.getTracks().forEach((track) => {
//             log('add track');
//             pc.addTrack(track, localStream);
//           });
//         }
//         join();
//       })
//       .catch(log);
//   };
//
//   const handleMetaDataLoad = () => {
//     const { innerWidth, innerHeight } = window;
//     const product = innerWidth * innerHeight;
//     if (product !== sizeTag) {
//       setSizeTag(product);
//     }
//   };
//
//   React.useEffect(() => {
//     handleMetaDataLoad();
//   }, [window.innerWidth, window.innerHeight]);
//
//   React.useEffect(() => {
//     pc.ontrack = function ({ track, streams }) {
//       echoLog('Got remote track');
//
//       console.log(streams[0].id)
//       if (remoteStream === undefined) {
//         getStats();
//         remoteStream = streams[0];
//         remoteVideo.srcObject = remoteStream;
//         remoteVideo.autoplay = true;
//         api.streamId = remoteStream.id;
//         const str = JSON.stringify(api, null, 2);
//         setApi(syntaxHighlight(str));
//       }
//     };
//
//     localVideo = document.getElementById('local-video');
//     remoteVideo = document.getElementById('remote-video');
//   }, []);
//
//   // socket.addEventListener('message', async (event) => {
//   //     const resp = JSON.parse(event.data)
//   //     // Listen for server renegotiation notifications
//   //     if (!resp.id && resp.method === "offer") {
//   //         log(`Got offer notification`)
//   //         await pc.setRemoteDescription(resp.params)
//   //         const answer = await pc.createAnswer()
//   //         await pc.setLocalDescription(answer)
//   //
//   //         const id = Math.random().toString()
//   //         log(`Sending answer`)
//   //         socket.send(JSON.stringify({
//   //             method: "answer",
//   //             params: { desc: answer },
//   //             id
//   //         }))
//   //     } else if (resp.method === "trickle") {
//   //         pc.addIceCandidate(resp.params).catch(log);
//   //     }
//   // })
//
//   return (
//     <div className='App'>
//       <header className='App-header'>
//         <nav className='navbar navbar-light bg-light border-bottom'>
//           <h3>Pion</h3>
//         </nav>
//         <div className='container pt-4'>
//           <div
//             className='row'
//             id='start-btns'
//             style={{ display: joining ? 'none' : 'block' }}
//           >
//             <div className='col-12'>
//               <button
//                 type='button'
//                 className='btn btn-primary'
//                 onClick={() => {
//                   start(false);
//                 }}
//               >
//                 start
//               </button>
//               <button
//                 type='button'
//                 className='btn btn-primary'
//                 onClick={() => {
//                   start(true);
//                 }}
//               >
//                 start with simulcast
//               </button>
//             </div>
//           </div>
//           <div className='row pt-3' id='controls' style={{ display: 'none' }}>
//             <div className='col-3'>
//               <strong>Video</strong>
//               <div id='simulcast-controls' style={{ display: 'none' }}>
//                 <div className='radio'>
//                   <label>
//                     <input
//                       type='radio'
//                       value='high'
//                       name='optvideos'
//                       checked={videoSettings === 'high'}
//                       onChange={setVideoSettings('high')}
//                     ></input>
//                     High
//                   </label>
//                 </div>
//                 <div className='radio'>
//                   <label>
//                     <input
//                       type='radio'
//                       checked={videoSettings === 'medium'}
//                       onChange={setVideoSettings('medium')}
//                       value='medium'
//                       name='optvideos'
//                     ></input>
//                     Medium
//                   </label>
//                 </div>
//                 <div className='radio'>
//                   <label>
//                     <input
//                       type='radio'
//                       checked={videoSettings === 'low'}
//                       onChange={setVideoSettings('low')}
//                       value='low'
//                       name='optvideos'
//                     ></input>
//                     Low
//                   </label>
//                 </div>
//                 <div className='radio'>
//                   <label>
//                     <input
//                       type='radio'
//                       checked={videoSettings === 'none'}
//                       onChange={setVideoSettings('none')}
//                       value='none'
//                       name='optvideos'
//                     ></input>
//                     Mute
//                   </label>
//                 </div>
//               </div>
//
//               <div id='simple-controls' style={{ display: 'none' }}>
//                 <div className='radio'>
//                   <label>
//                     <input
//                       type='radio'
//                       checked={videoSettings === 'high'}
//                       onChange={setVideoSettings('high')}
//                       value='high'
//                       name='optvideo'
//                       checked
//                     ></input>
//                     Unmute
//                   </label>
//                 </div>
//                 <div className='radio'>
//                   <label>
//                     <input
//                       type='radio'
//                       checked={videoSettings === 'none'}
//                       onChange={setVideoSettings('none')}
//                       value='none'
//                       name='optvideo'
//                     ></input>
//                     Mute
//                   </label>
//                 </div>
//               </div>
//             </div>
//             <div className='col-3'>
//               <strong>Audio</strong>
//               <div className='radio'>
//                 <label>
//                   <input
//                     type='radio'
//                     checked={audioSettings === true}
//                     onChange={setAudioSettings(true)}
//                     value={true}
//                     name='optaudio'
//                   ></input>
//                   Unmute
//                 </label>
//               </div>
//               <div className='radio'>
//                 <label>
//                   <input
//                     type='radio'
//                     checked={audioSettings === false}
//                     onChange={setAudioSettings(false)}
//                     value={false}
//                     name='optaudio'
//                   ></input>{' '}
//                   Mute
//                 </label>
//               </div>
//             </div>
//             <div className='col-6'>
//               <strong>API call</strong>
//               <pre
//                 id='api'
//                 className='d-block border'
//                 dangerouslySetInnerHTML={{ __html: apiValue }}
//                 style={{ backgroundColor: '#f8f9fa', height: '117px' }}
//               />
//             </div>
//           </div>
//           <div className='row'>
//             <div className='col-6 pt-2'>
//               <span
//                 style={{
//                   position: 'absolute',
//                   marginLeft: '5px',
//                   marginTop: '5px',
//                 }}
//                 className='badge badge-primary'
//               >
//                 Local
//               </span>
//               <video
//                 width='320'
//                 height='240'
//                 id='local-video'
//                 style={{ backgroundColor: 'black' }}
//                 onLoadedMetadata={handleMetaDataLoad}
//               />
//               <strong className='d-block'>Local logs:</strong>
//               <div
//                 id='local-logs'
//                 className='mt-2 d-block'
//                 style={{ backgroundColor: '#f8f9fa' }}
//                 dangerouslySetInnerHTML={{ __html: localLogs }}
//               />
//             </div>
//             <div className='col-6 pt-2'>
//               <span
//                 style={{
//                   position: 'absolute',
//                   marginLeft: '5px',
//                   marginTop: '5px',
//                 }}
//                 className='badge badge-primary'
//               >
//                 Remote
//               </span>
//               <span
//                 id='size-tag'
//                 style={{
//                   position: 'absolute',
//                   marginLeft: '5px',
//                   top: '225px',
//                 }}
//                 className='badge badge-primary'
//               >
//                 {sizeTag}
//               </span>
//               <span
//                 id='br-tag'
//                 style={{ position: 'absolute', left: '270px', top: '225px' }}
//                 className='badge badge-primary'
//               ></span>
//               <video
//                 id='remote-video'
//                 style={{ backgroundColor: 'black' }}
//                 width='320'
//                 height='240'
//               ></video>
//               <strong className='d-block'>Echo logs:</strong>
//               <div
//                 id='echo-logs'
//                 className='mt-2 d-block'
//                 style={{ backgroundColor: '#f8f9fa' }}
//                 dangerouslySetInnerHTML={{ __html: echoLogs }}
//               />
//             </div>
//           </div>
//         </div>
//       </header>
//     </div>
//   );
// }
//
// export default App;


import React from 'react';
import logo from './logo.svg';
import './App.css';
import Group from './Group.js';

let localLogs = '',
    echoLogs = '';

/* eslint-env browser */
const log = (msg) => {
  localLogs += `${msg} </br>`;
};

const echoLog = (msg) => {
  echoLogs += `${msg} </br>`;
};

const config = {
  iceServers: [
    {
      urls: 'turn:conectar.demo.forasoft.com?transport=tcp',
      username: 'conectar',
      credential: 'ZVp1NaagEN7r',
    },
    {
      urls: 'stun:stun.l.google.com:19302',
    },
  ],
};

const socket = new WebSocket('ws://18.195.79.21:7000/ws');
const pc = new RTCPeerConnection(config);
let localVideo;
let remoteVideo;
let simulcast = false;

socket.onopen = () => {
  console.log('CONNECTED');
};


pc.oniceconnectionstatechange = () =>
    log(`ICE connection state: ${pc.iceConnectionState}`);

pc.onicecandidate = (event) => {
  if (event.candidate !== null) {
    console.log('signal');
    socket.send(
        JSON.stringify({
          method: 'trickle',
          params: {
            candidate: event.candidate,
          },
        })
    );
  }
};

socket.addEventListener('message', async (event) => {
  const resp = JSON.parse(event.data);
  // Listen for server renegotiation notifications
  if (!resp.id && resp.method === 'offer') {
    log(`Got offer notification`);
    await pc.setRemoteDescription(resp.params);
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    const id = Math.random().toString();
    log(`Sending answer`);
    socket.send(
        JSON.stringify({
          method: 'answer',
          params: {
            desc: answer,
          },
          id,
        })
    );
  } else if (resp.method === 'trickle') {
    pc.addIceCandidate(resp.params).catch(log);
    setTimeout(() => startEcho(), 500);
  }
});

function syntaxHighlight(json) {
  json = json
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  return json.replace(
      /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
      function (match) {
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
      }
  );
}

const startEcho = () => {
  pc.addTransceiver('video', {
    direction: 'sendrecv',
  });
  pc.addTransceiver('audio', {
    direction: 'sendrecv',
  });

};

const add = () => {
  pc.addTrack(localStream.getAudioTracks()[0], localStream);
};

let localStream;
let remoteStream;
let pid;

// remotepc
let sendChannel = pc.createDataChannel('ion-sfu');
sendChannel.onclose = () => echoLog('sendChannel has closed');
sendChannel.onopen = () => {
  echoLog('sendChannel has opened');
};
sendChannel.onmessage = (e) =>
    echoLog(
        `Message from DataChannel '${sendChannel.label}' payload '${e.data}'`
    );

const api = {
  streamId: '',
  video: 'high',
  audio: true,
};



const handleJoin = async () => {
  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);
  const id = Math.random().toString();
  console.log(offer);

  socket.send(
      JSON.stringify({
        method: 'join',
        params: {
          sid: 'test room',
          offer: pc.localDescription,
        },
        id,
      })
  );

  socket.addEventListener('message', (event) => {
    const resp = JSON.parse(event.data);
    if (resp.id === id) {
      log(`Got publish answer`);
      // Hook this here so it's not called before joining
      pc.onnegotiationneeded = async function () {
        log('Renegotiating');
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        const id = Math.random().toString();
        socket.send(
            JSON.stringify({
              method: 'offer',
              params: {
                desc: offer,
              },
              id,
            })
        );

        socket.addEventListener('message', (event) => {
          const resp = JSON.parse(event.data);
          if (resp.id === id) {
            log(`Got renegotiation answer`);
            pc.setRemoteDescription(resp.result);
          }
        });
      };
      console.log(resp.result);
      pc.setRemoteDescription(resp.result)
    }
  });
};



function App() {
  const [brTag, setBrTag] = React.useState('');
  const [apiValue, setApi] = React.useState('');
  const [sizeTag, setSizeTag] = React.useState(0);
  const [joining, setJoining] = React.useState(false);
  const [videoSettings, SVS] = React.useState('high');
  const [audioSettings, SAS] = React.useState(true);
  const [streamArray, setStreamArray]=React.useState([


  ])

  const join = () => {
    setJoining(true);
    handleJoin();
  };

  const setVideoSettings = (value) => () => SVS(value);
  const setAudioSettings = (value) => () => SAS(value);
  let valueExist=false;
  let streamId=0;
  function isValueExist(value) {
    if(value.key===streamId){
      valueExist=true
    }else {
      valueExist=false;
    }
  }

  const getStats = () => {
    let bytesPrev;
    let timestampPrev;
    setInterval(() => {
      pc.getStats(null).then((results) => {
        results.forEach((report) => {
          const now = report.timestamp;

          let bitrate;
          if (report.type === 'inbound-rtp' && report.mediaType === 'video') {
            const bytes = report.bytesReceived;
            if (timestampPrev) {
              bitrate = (8 * (bytes - bytesPrev)) / (now - timestampPrev);
              bitrate = Math.floor(bitrate);
            }
            bytesPrev = bytes;
            timestampPrev = now;
          }
          if (bitrate) {
            setBrTag(`${bitrate} kbps`);
          }
        });
      });
    }, 1000);
  };

  React.useEffect(() => {
    if (sendChannel.readyState === 'open') {
      api.video = videoSettings;
      const str = JSON.stringify(api, null, 2);
      sendChannel.send(str);
      setApi(syntaxHighlight(str));
    }
  }, [videoSettings]);

  React.useEffect(() => {
    if (sendChannel.readyState === 'open') {
      api.audio = audioSettings;
      const str = JSON.stringify(api, null, 2);
      sendChannel.send(str);
      setApi(syntaxHighlight(str));
    }
  }, [audioSettings]);

  const start = (sc) => {
    simulcast = sc;
    navigator.mediaDevices
        .getUserMedia({
          video: {
            width: { min: 1024, ideal: 1280, max: 1920 },
            height: { min: 576, ideal: 720, max: 1080 },
            frameRate: {
              ideal: 30,
              max: 60,
            },
          },
          audio: true,
        })
        .then((stream) => {
          localVideo.srcObject = stream;
          localVideo.autoplay = true;
          localVideo.controls = true;
          localVideo.muted = true;
          localStream = stream;

          log('Publishing stream');
          if (simulcast) {
            pc.addTransceiver(localStream.getVideoTracks()[0], {
              streams: [localStream],
              direction: 'sendrecv',
              sendEncodings: [
                {
                  rid: 'f',
                },
                {
                  rid: 'h',
                  scaleResolutionDownBy: 2.0,
                  maxBitrate: 150000,
                },
                {
                  rid: 'q',
                  scaleResolutionDownBy: 4.0,
                  maxBitrate: 100000,
                },
              ],
            });
            pc.addTrack(stream.getAudioTracks()[0], localStream);
          } else {
            localStream.getTracks().forEach((track) => {
              log('add track');
              pc.addTrack(track, localStream);
            });
          }

          join();
          document.getElementById('controls').style.display = 'flex';
          if (simulcast) {
            document.getElementById('simulcast-controls').style.display = 'block';
          } else {
            document.getElementById('simple-controls').style.display = 'block';
          }
        })
        .catch(log);
  };

  const handleMetaDataLoad = () => {
    const { innerWidth, innerHeight } = window;
    const product = innerWidth * innerHeight;
    if (product !== sizeTag) {
      setSizeTag(product);
    }
  };

  React.useEffect(() => {
    handleMetaDataLoad();
  }, [window.innerWidth, window.innerHeight]);

  React.useEffect(() => {
    pc.ontrack = function ({ track, streams }) {
      echoLog('Got remote track');
      streamId=streams[0].id
      streamArray.every(item =>{
        isValueExist(item)
        if (valueExist===true){
         return
        }

      });
      if(valueExist===false){

        remoteStream = streams[0];
        let  newArray = [...streamArray, {key:streamId,source:remoteStream,autoplay:true}];
        setStreamArray(newArray);
        api.streamId = remoteStream.id;
        const str = JSON.stringify(api, null, 2);
        setApi(syntaxHighlight(str));
        console.log(streamArray)


      }


      console.log(streams[0].id)
      if (remoteStream === undefined) {

      }
    };

    localVideo = document.getElementById('local-video');
  }, [streamArray]);

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

  return (
      <div className='App'>
        <header className='App-header'>
          <nav className='navbar navbar-light bg-light border-bottom'>
            <h3>Pion</h3>
          </nav>
          <div className='container pt-4'>
            <div
                className='row'
                id='start-btns'
                style={{ display: joining ? 'none' : 'block' }}
            >
              <div className='col-12'>
                <button
                    type='button'
                    className='btn btn-primary'
                    onClick={() => {
                      start(false);
                    }}
                >
                  start
                </button>
                <button
                    type='button'
                    className='btn btn-primary'
                    onClick={() => {
                      start(true);
                    }}
                >
                  start with simulcast
                </button>
              </div>
            </div>
            <div className='row pt-3' id='controls' style={{ display: 'none' }}>
              <div className='col-3'>
                <strong>Video</strong>
                <div id='simulcast-controls' style={{ display: 'none' }}>
                  <div className='radio'>
                    <label>
                      <input
                          type='radio'
                          value='high'
                          name='optvideos'
                          checked={videoSettings === 'high'}
                          onChange={setVideoSettings('high')}
                      ></input>
                      High
                    </label>
                  </div>
                  <div className='radio'>
                    <label>
                      <input
                          type='radio'
                          checked={videoSettings === 'medium'}
                          onChange={setVideoSettings('medium')}
                          value='medium'
                          name='optvideos'
                      ></input>
                      Medium
                    </label>
                  </div>
                  <div className='radio'>
                    <label>
                      <input
                          type='radio'
                          checked={videoSettings === 'low'}
                          onChange={setVideoSettings('low')}
                          value='low'
                          name='optvideos'
                      ></input>
                      Low
                    </label>
                  </div>
                  <div className='radio'>
                    <label>
                      <input
                          type='radio'
                          checked={videoSettings === 'none'}
                          onChange={setVideoSettings('none')}
                          value='none'
                          name='optvideos'
                      ></input>
                      Mute
                    </label>
                  </div>
                </div>

                <div id='simple-controls' style={{ display: 'none' }}>
                  <div className='radio'>
                    <label>
                      <input
                          type='radio'
                          checked={videoSettings === 'high'}
                          onChange={setVideoSettings('high')}
                          value='high'
                          name='optvideo'
                          checked
                      ></input>
                      Unmute
                    </label>
                  </div>
                  <div className='radio'>
                    <label>
                      <input
                          type='radio'
                          checked={videoSettings === 'none'}
                          onChange={setVideoSettings('none')}
                          value='none'
                          name='optvideo'
                      ></input>
                      Mute
                    </label>
                  </div>
                </div>
              </div>
              <div className='col-3'>
                <strong>Audio</strong>
                <div className='radio'>
                  <label>
                    <input
                        type='radio'
                        checked={audioSettings === true}
                        onChange={setAudioSettings(true)}
                        value={true}
                        name='optaudio'
                    ></input>
                    Unmute
                  </label>
                </div>
                <div className='radio'>
                  <label>
                    <input
                        type='radio'
                        checked={audioSettings === false}
                        onChange={setAudioSettings(false)}
                        value={false}
                        name='optaudio'
                    ></input>{' '}
                    Mute
                  </label>
                </div>
              </div>
              <div className='col-6'>
                <strong>API call</strong>
                <pre
                    id='api'
                    className='d-block border'
                    dangerouslySetInnerHTML={{ __html: apiValue }}
                    style={{ backgroundColor: '#f8f9fa', height: '117px' }}
                />
              </div>
            </div>
            <div className='row'>
              <div className='col-6 pt-2'>
              <span
                  style={{
                    position: 'absolute',
                    marginLeft: '5px',
                    marginTop: '5px',
                  }}
                  className='badge badge-primary'
              >
                Local
              </span>
                <video
                    width='320'
                    height='240'
                    id='local-video'
                    style={{ backgroundColor: 'black' }}
                    onLoadedMetadata={handleMetaDataLoad}
                />
                <strong className='d-block'>Local logs:</strong>
                <div
                    id='local-logs'
                    className='mt-2 d-block'
                    style={{ backgroundColor: '#f8f9fa' }}
                    dangerouslySetInnerHTML={{ __html: localLogs }}
                />
              </div>
              <div className='col-6 pt-2'>
              <span
                  style={{
                    position: 'absolute',
                    marginLeft: '5px',
                    marginTop: '5px',
                  }}
                  className='badge badge-primary'
              >
                Remote
              </span>
                <span
                    id='size-tag'
                    style={{
                      position: 'absolute',
                      marginLeft: '5px',
                      top: '225px',
                    }}
                    className='badge badge-primary'
                >
                {sizeTag}
              </span>
                <span
                    id='br-tag'
                    style={{ position: 'absolute', left: '270px', top: '225px' }}
                    className='badge badge-primary'
                ></span>
                <Group >{
                  streamArray.map(item => ( <video
                      key={item.key}
                      className='remote-video'
                      style={{ backgroundColor: 'black', marginRight:'2vh' }}
                      width='320'
                      height='240'
                      src={item.source}
                      autoPlay={item.autoplay}


                  ></video>))

                }

                </Group>
                <strong className='d-block'>Echo logs:</strong>
                <div
                    id='echo-logs'
                    className='mt-2 d-block'
                    style={{ backgroundColor: '#f8f9fa' }}
                    dangerouslySetInnerHTML={{ __html: echoLogs }}
                />
              </div>
            </div>
          </div>
        </header>
      </div>
  );
}

export default App;
