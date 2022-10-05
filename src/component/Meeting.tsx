import React, {
  Dispatch,
  SetStateAction,
  useEffect,
  useRef,
  useState,
} from "react";
import { useDispatch, useSelector } from "react-redux";
import styled from "styled-components";
import { setUpcomingDateList } from "../functions/datingReducerFunction";
import { Btn } from "../pages/ProfileSetting/UserInfos";
import { Dating } from "../reducers/dating";
import { Profile } from "../reducers/profile";
import meetingBanner from "./img/meetingBanner.png";
import phoneCall from "./img/phone-call.png";
import { db } from "../utils/firebase";
import {
  getDocs,
  collection,
  doc,
  updateDoc,
  query,
  where,
} from "firebase/firestore";
import close from "./img/close.png";

const CloseBtn = styled.img`
  cursor: pointer;
  width: 20px;
  height: 20px;
  position: absolute;
  right: 15px;
  top: 15px;
`;

const MeetingContainer = styled.div`
  width: 70vw;
  height: 80vh;
  border: solid 1px #fff;
  position: absolute;
  z-index: 2501;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  border-radius: 8px;
  padding: 50px;
  background-color: #efefef;
  overflow-x: hidden;
`;

const MeetingPerson = styled.video`
  height: 75%;
  width: 80%;
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  border-radius: 5px;
  @media (max-width: 780px) {
    height: 35vh;
    width: auto;
  }
`;

const MeetingMe = styled.video`
  height: 20vh;
  position: absolute;
  bottom: 70px;
  right: 30px;
  border-radius: 5px;
  @media (max-width: 780px) {
    height: 15vh;
  }
  @media (max-width: 600px) {
    height: 10vh;
    right: 15px;
    bottom: 100px;
  }
`;

const PhoneBtn = styled(Btn)`
  left: 50%;
  bottom: 15px;
  transform: translateX(-50%);
  @media (max-width: 600px) {
    font-size: 16px;
  }
`;

const ImgBtn = styled.img`
  width: 15px;
  height: 15px;
`;

const TextInfoBtn = styled.div`
  position: absolute;
  font-size: 18px;
  color: #737373;
  letter-spacing: 1.5px;
  text-align: center;
  border: solid 3px #d1cfcf;
  border-radius: 5px;
  padding: 10px;
  transition: 0.3s;
  left: 50%;
  bottom: 15px;
  transform: translateX(-50%);
  @media (max-width: 600px) {
    font-size: 16px;
  }
  @media (max-width: 453px) {
    font-size: 14px;
  }
`;

const BlackMask = styled.div`
  opacity: 0.5;
  overflow-y: hidden;
  transition: 0.3s;
  position: fixed;
  background-color: black;
  width: 100vw;
  top: 0;
  left: 0;
  height: 100vh;
  z-index: 1;
`;

const NowStatus = styled.div`
  position: absolute;
  left: -3px;
  top: 20px;
  padding: 10px 15px;
  font-size: 18px;
  background-color: #d8b2ad;
  border-radius: 3px;
  @media (max-width: 600px) {
    font-size: 16px;
    padding: 5px 10px;
    width: 200px;
  }
`;

type MeetingType = {
  nowMeetingShelter: {
    petId: number;
    shelterName: string;
    userName: string;
    index: number;
  };
  setOpenMeeting: Dispatch<SetStateAction<boolean>>;
};

const Meeting: React.FC<MeetingType> = (props) => {
  const dispatch = useDispatch();
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const pc = useRef<RTCPeerConnection>();
  const localStreamRef = useRef<MediaStream>();
  const wsRef = useRef(new WebSocket("wss://fluffyserver.herokuapp.com"));
  // const wsRef = useRef(new WebSocket("wss://localhost:3000"));
  const [status, setStatus] = useState("開始通話");
  const profile = useSelector<{ profile: Profile }>(
    (state) => state.profile
  ) as Profile;
  const dating = useSelector<{ dating: Dating }>(
    (state) => state.dating
  ) as Dating;

  const initWs = () => {
    wsRef.current.onopen = () => console.log("ws 已經打開");
    wsRef.current.onmessage = wsOnMessage;
  };

  const wsOnMessage = async (e: MessageEvent) => {
    const wsData = JSON.parse(e.data);
    const wsType = wsData["type"];

    if (wsType === "leave") {
      if (pc.current) {
        pc.current.close();
        pc.current = undefined;
        remoteVideoRef.current!.srcObject = null;
        props.setOpenMeeting(false);
        const allUpcomingList = [...dating.upcomingDateList];
        allUpcomingList[props.nowMeetingShelter.index] = {
          ...allUpcomingList[props.nowMeetingShelter.index],
          doneWithMeeting: true,
        };
        dispatch(setUpcomingDateList(allUpcomingList));

        const q = query(
          collection(db, `/memberProfiles/${profile.uid}/upcomingDates`),
          where("id", "==", allUpcomingList[props.nowMeetingShelter.index].id)
        );
        const querySnapshot = await getDocs(q);
        const promises: any[] = [];
        querySnapshot.forEach(async (d) => {
          const updatingRef = doc(
            db,
            `/memberProfiles/${profile.uid}/upcomingDates`,
            d.id
          );

          promises.push(
            updateDoc(
              updatingRef,
              allUpcomingList[props.nowMeetingShelter.index]
            )
          );
        });
        await Promise.all(promises);
      }
    }

    const wsUsername = wsData["username"];
    if (profile.uid === wsUsername) {
      return;
    }

    if (wsType === "offer") {
      const wsOffer = wsData["data"];
      pc.current?.setRemoteDescription(
        new RTCSessionDescription(JSON.parse(wsOffer))
      );
      setStatus("電話響起");
    }
    if (wsType === "answer") {
      const wsAnswer = wsData["data"];
      pc.current?.setRemoteDescription(
        new RTCSessionDescription(JSON.parse(wsAnswer))
      );
      setStatus("通話中");
    }
    if (wsType === "candidate") {
      const wsCandidate = JSON.parse(wsData["data"]);
      pc.current?.addIceCandidate(new RTCIceCandidate(wsCandidate));
    }
  };

  const wsSend = (type: string, data: any) => {
    wsRef.current.send(
      JSON.stringify({
        username: profile.uid,
        type,
        data,
      })
    );
  };

  // 詢問攝影機與音訊權限
  const getMediaDevices = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: false,
    });
    console.log(stream);
    localVideoRef.current!.srcObject = stream;
    localStreamRef.current = stream;
  };

  // 交換 sdp
  // 設置為當前連接的本地描述
  const createOffer = () => {
    pc.current
      ?.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true, // 接收視頻接收音頻
      })
      .then((sdp) => {
        console.log("offer", JSON.stringify(sdp));
        pc.current?.setLocalDescription(sdp);
        wsSend("offer", JSON.stringify(sdp));
        setStatus("等待對方接聽");
      });
  };

  const createAnswer = () => {
    pc.current
      ?.createAnswer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true, // 接收視頻接收音頻
      })
      .then((sdp) => {
        console.log("answer", JSON.stringify(sdp));
        pc.current?.setLocalDescription(sdp);
        wsSend("answer", JSON.stringify(sdp));
        setStatus("通話中");
      });
  };

  const createRtcConnection = () => {
    const _pc = new RTCPeerConnection({
      iceServers: [
        {
          urls: ["stun:stun.stunprotocol.org:3478"],
        },
      ],
    });
    _pc.onicecandidate = (e) => {
      if (e.candidate) {
        console.log("candidate", JSON.stringify(e.candidate));
        wsSend("candidate", JSON.stringify(e.candidate));
      }
    };
    _pc.ontrack = (e) => {
      remoteVideoRef.current!.srcObject = e.streams[0];
    };
    pc.current = _pc;
  };

  const addLocalStreamToRtcConnection = () => {
    console.log("addlocal");
    const localStream = localStreamRef.current!;
    localStream.getTracks().forEach((track) => {
      pc.current!.addTrack(track, localStream);
      console.log(track);
    });
  };

  const hangup = () => {
    if (pc.current) {
      wsSend("leave", "離線");
    }
  };

  useEffect(() => {
    initWs();
    getMediaDevices().then(() => {
      createRtcConnection();
      addLocalStreamToRtcConnection();
    });
  }, []);

  return (
    <>
      <BlackMask />
      <MeetingContainer>
        {props.nowMeetingShelter && (
          <NowStatus>
            視訊約會：來自{props.nowMeetingShelter.shelterName}的{" "}
            {props.nowMeetingShelter.petId}
          </NowStatus>
        )}

        <MeetingPerson
          ref={remoteVideoRef}
          autoPlay
          poster={meetingBanner}
        ></MeetingPerson>
        <MeetingMe ref={localVideoRef} autoPlay></MeetingMe>
        {status === "開始通話" && (
          <PhoneBtn onClick={() => createOffer()}>
            <ImgBtn src={phoneCall} />
            {"  "}撥打電話給收容所
          </PhoneBtn>
        )}
        {status === "等待對方接聽" && (
          <TextInfoBtn>等待對方接聽 ...</TextInfoBtn>
        )}
        {status === "電話響起" && (
          <PhoneBtn onClick={createAnswer}>接聽電話</PhoneBtn>
        )}
        {status === "通話中" && (
          <PhoneBtn
            onClick={async () => {
              hangup();
              props.setOpenMeeting(false);
              const allUpcomingList = [...dating.upcomingDateList];
              allUpcomingList[props.nowMeetingShelter.index] = {
                ...allUpcomingList[props.nowMeetingShelter.index],
                doneWithMeeting: true,
              };
              dispatch(setUpcomingDateList(allUpcomingList));

              const q = query(
                collection(db, `/memberProfiles/${profile.uid}/upcomingDates`),
                where(
                  "id",
                  "==",
                  allUpcomingList[props.nowMeetingShelter.index].id
                )
              );
              const querySnapshot = await getDocs(q);
              const promises: any[] = [];
              querySnapshot.forEach(async (d) => {
                const updatingRef = doc(
                  db,
                  `/memberProfiles/${profile.uid}/upcomingDates`,
                  d.id
                );

                promises.push(
                  updateDoc(
                    updatingRef,
                    allUpcomingList[props.nowMeetingShelter.index]
                  )
                );
              });
              await Promise.all(promises);
            }}
          >
            結束視訊
          </PhoneBtn>
        )}
        <CloseBtn src={close} onClick={() => props.setOpenMeeting(false)} />
      </MeetingContainer>
    </>
  );
};

export default Meeting;